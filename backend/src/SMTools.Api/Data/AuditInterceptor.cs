using System.Collections.Concurrent;
using System.Reflection;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.Extensions.Logging;
using SMTools.Abstractions;
using SMTools.Identity.Models;

#pragma warning disable CA1848 // LoggerMessage delegates are not needed for audit-only logging

namespace SMTools.Api.Data;

/// <summary>
/// SaveChanges interceptor that records audit entries for entity changes.
/// </summary>
/// <remarks>
/// Audit entries are persisted after the business context's own save has completed
/// (best-effort). If the business save fails the queued audit entries are discarded.
/// A failure in audit persistence logs an error but does not abort the business operation.
/// </remarks>
public sealed class AuditInterceptor : SaveChangesInterceptor
{
    private readonly ICurrentUserAccessor _userAccessor;
    private readonly IDbContextFactory<AuditDbContext> _auditContextFactory;
    private readonly ILogger<AuditInterceptor> _logger;
    private readonly ConcurrentQueue<List<AuditEntry>> _pendingEntries = [];

    public AuditInterceptor(
        ICurrentUserAccessor userAccessor,
        IDbContextFactory<AuditDbContext> auditContextFactory,
        ILogger<AuditInterceptor> logger)
    {
        _userAccessor = userAccessor;
        _auditContextFactory = auditContextFactory;
        _logger = logger;
    }

    public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        var context = eventData.Context;
        if (context is null)
            return result;

        var entries = context.ChangeTracker.Entries()
            .Where(e => e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
            .ToList();

        if (entries.Count == 0)
            return result;

        var auditEntries = new List<AuditEntry>(entries.Count);
        foreach (var entry in entries)
        {
            if (entry.Entity.GetType().Name is nameof(AuditEntry) or nameof(UserSession))
                continue;

            var entityId = entry.Property("Id")?.CurrentValue?.ToString() ?? "unknown";

            auditEntries.Add(new AuditEntry
            {
                Id = Guid.NewGuid(),
                UserId = _userAccessor.UserId,
                Action = entry.State switch
                {
                    EntityState.Added => "CREATE",
                    EntityState.Modified => "UPDATE",
                    EntityState.Deleted => "DELETE",
                    _ => "UNKNOWN",
                },
                EntityType = entry.Entity.GetType().Name,
                EntityId = entityId,
                OldValues = entry.State == EntityState.Modified
                    ? JsonSerializer.Serialize(GetPropertyValues(entry.OriginalValues))
                    : null,
                NewValues = entry.State != EntityState.Deleted
                    ? JsonSerializer.Serialize(GetPropertyValues(entry.CurrentValues))
                    : null,
                Timestamp = DateTimeOffset.UtcNow,
                IpAddress = _userAccessor.IpAddress,
            });
        }

        if (auditEntries.Count > 0)
        {
            _pendingEntries.Enqueue(auditEntries);
        }

        return result;
    }

    public override async ValueTask<int> SavedChangesAsync(
        SaveChangesCompletedEventData eventData,
        int result,
        CancellationToken cancellationToken = default)
    {
        if (_pendingEntries.TryDequeue(out var auditEntries))
        {
            await using var auditContext = await _auditContextFactory.CreateDbContextAsync(cancellationToken);
            try
            {
                auditContext.AuditEntries.AddRange(auditEntries);
                await auditContext.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Audit save failed after business context save. Audit entries may be lost.");
            }
        }

        return await base.SavedChangesAsync(eventData, result, cancellationToken);
    }

    public override Task SaveChangesFailedAsync(
        DbContextErrorEventData eventData,
        CancellationToken cancellationToken = default)
    {
        if (_pendingEntries.TryDequeue(out var entries))
        {
            _logger.LogWarning("Audit entries lost due to save failure: {Count} entries", entries.Count);
        }

        return base.SaveChangesFailedAsync(eventData, cancellationToken);
    }

    private static readonly HashSet<string> SensitivePropertyNames =
        ["Password", "Hash", "Token", "Secret"];

    private static bool IsSensitiveProperty(IProperty property)
    {
        if (property.PropertyInfo?.GetCustomAttribute<SkipAuditAttribute>() is not null)
            return true;

        foreach (var iface in property.DeclaringType.ClrType.GetInterfaces())
        {
            var map = property.DeclaringType.ClrType.GetInterfaceMap(iface);
            for (var i = 0; i < map.InterfaceMethods.Length; i++)
            {
                if (map.TargetMethods[i] == property.PropertyInfo?.GetMethod
                    || map.TargetMethods[i] == property.PropertyInfo?.SetMethod)
                {
                    var ifaceProp = iface.GetProperty(
                        property.Name,
                        BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly);
                    if (ifaceProp?.GetCustomAttribute<SkipAuditAttribute>() is not null)
                        return true;
                }
            }
        }

        return SensitivePropertyNames.Any(n =>
            property.Name.Contains(n, StringComparison.OrdinalIgnoreCase));
    }

    private static Dictionary<string, object?> GetPropertyValues(PropertyValues values)
    {
        var result = new Dictionary<string, object?>();
        foreach (var property in values.Properties)
        {
            if (IsSensitiveProperty(property))
                continue;

            var value = values[property];
            result[property.Name] = value;
        }
        return result;
    }
}
