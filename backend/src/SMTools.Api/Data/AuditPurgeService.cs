using Microsoft.EntityFrameworkCore;

namespace SMTools.Api.Data;

public sealed partial class AuditPurgeService : PeriodicPurgeServiceBase<AuditPurgeService>
{
    private readonly IDbContextFactory<AuditDbContext> _auditFactory;
    private readonly int _retentionDays;

    public AuditPurgeService(
        IDbContextFactory<AuditDbContext> auditFactory,
        ILogger<AuditPurgeService> logger,
        IConfiguration configuration)
    {
        _auditFactory = auditFactory;
        Logger = logger;
        PurgeInterval = TimeSpan.FromHours(configuration.GetValue<int>("Audit:PurgeIntervalHours", 24));
        _retentionDays = configuration.GetValue<int>("Audit:RetentionDays", 30);
    }

    protected override TimeSpan InitialDelay => TimeSpan.FromMinutes(5);
    protected override TimeSpan PurgeInterval { get; }
    protected override ILogger Logger { get; }
    protected override Task PurgeAsync(CancellationToken ct) => PurgeOldAuditEntriesAsync(ct);

    private async Task PurgeOldAuditEntriesAsync(CancellationToken ct)
    {
        var cutoff = DateTimeOffset.UtcNow.AddDays(-_retentionDays);
        await using var db = await _auditFactory.CreateDbContextAsync(ct);
        var deleted = await db.AuditEntries
            .Where(a => a.Timestamp < cutoff)
            .ExecuteDeleteAsync(ct);
        if (deleted > 0)
            LogPurgedRecords(Logger, deleted);
    }

    [LoggerMessage(Level = LogLevel.Information, Message = "Purged {Count} old audit entries")]
    private static partial void LogPurgedRecords(ILogger logger, int count);
}
