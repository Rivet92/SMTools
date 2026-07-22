using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using SMTools.Identity.Data;
using SMTools.Identity.Models;
using SMTools.Abstractions;

namespace SMTools.Identity.Auth;

public sealed partial class DatabaseTicketStore : ITicketStore
{
    private readonly IDbContextFactory<IdentityDbContext> _dbFactory;
    private readonly ILogger<DatabaseTicketStore> _logger;
    private readonly IDataProtector _protector;

    public DatabaseTicketStore(
        IDbContextFactory<IdentityDbContext> dbFactory,
        ILogger<DatabaseTicketStore> logger,
        IDataProtectionProvider dataProtectionProvider)
    {
        _dbFactory = dbFactory;
        _logger = logger;
        _protector = dataProtectionProvider.CreateProtector("SMTools.Identity.SessionTicket");
    }

    public async Task<string> StoreAsync(AuthenticationTicket ticket)
    {
        var userIdClaim = ticket.Principal.FindFirst(SMToolsClaimTypes.UserId);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            throw new InvalidOperationException("Cannot persist a ticket without a user id claim.");
        }

        var sessionId = Guid.NewGuid();
        var sessionTicket = SessionTicketData.FromAuthenticationTicket(ticket);
        var serializedTicket = JsonSerializer.Serialize(sessionTicket);
        var protectedTicket = _protector.Protect(serializedTicket);

        await using var db = await _dbFactory.CreateDbContextAsync();

        db.UserSessions.Add(new UserSession
        {
            Id = sessionId,
            UserId = userId,
            Ticket = protectedTicket,
            ExpiresAt = ticket.Properties.ExpiresUtc ?? DateTimeOffset.UtcNow.AddDays(7),
            CreatedAt = DateTimeOffset.UtcNow,
        });

        await db.SaveChangesAsync();
        LogSessionCreated(_logger, sessionId, userId, ticket.Properties.ExpiresUtc);

        return sessionId.ToString("N");
    }

    public async Task RenewAsync(string key, AuthenticationTicket ticket)
    {
        if (!Guid.TryParseExact(key, "N", out var sessionId))
        {
            return;
        }

        var sessionTicket = SessionTicketData.FromAuthenticationTicket(ticket);
        var serializedTicket = JsonSerializer.Serialize(sessionTicket);
        var protectedTicket = _protector.Protect(serializedTicket);

        await using var db = await _dbFactory.CreateDbContextAsync();

        var session = await db.UserSessions.FindAsync(sessionId);
        if (session is null)
        {
            LogRenewUnknownSession(_logger, sessionId);
            return;
        }

        session.Ticket = protectedTicket;
        session.ExpiresAt = ticket.Properties.ExpiresUtc ?? DateTimeOffset.UtcNow.AddDays(7);

        await db.SaveChangesAsync();
        LogSessionRenewed(_logger, sessionId);
    }

    public async Task<AuthenticationTicket?> RetrieveAsync(string key)
    {
        if (!Guid.TryParseExact(key, "N", out var sessionId))
        {
            return null;
        }

        await using var db = await _dbFactory.CreateDbContextAsync();

        var session = await db.UserSessions.FindAsync(sessionId);
        if (session is null)
        {
            LogSessionNotFound(_logger, sessionId);
            return null;
        }

        if (session.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            LogSessionExpired(_logger, sessionId, session.ExpiresAt);
            return null;
        }

        try
        {
            var unprotectedTicket = _protector.Unprotect(session.Ticket);
            var sessionTicket = JsonSerializer.Deserialize<SessionTicketData>(unprotectedTicket);
            if (sessionTicket is null)
            {
                return null;
            }

            var ticket = sessionTicket.ToAuthenticationTicket(CookieAuthenticationDefaults.AuthenticationScheme);
            LogSessionRetrieved(
                _logger,
                sessionId,
                ticket.Principal.FindFirst(SMToolsClaimTypes.UserId)?.Value ?? "unknown",
                ticket.Principal.Identity?.IsAuthenticated ?? false);
            return ticket;
        }
        catch (Exception ex) when (ex is JsonException or CryptographicException)
        {
            LogSessionDeserializationFailed(_logger, ex, sessionId);
            return null;
        }
    }

    public async Task RemoveAsync(string key)
    {
        if (!Guid.TryParseExact(key, "N", out var sessionId))
        {
            return;
        }

        await using var db = await _dbFactory.CreateDbContextAsync();

        var session = await db.UserSessions.FindAsync(sessionId);
        if (session is not null)
        {
            db.UserSessions.Remove(session);
            await db.SaveChangesAsync();
            LogSessionRemoved(_logger, sessionId);
        }
    }

    [LoggerMessage(Level = LogLevel.Information, Message = "Created session {SessionId} for user {UserId} expiring {ExpiresAt}")]
    private static partial void LogSessionCreated(ILogger logger, Guid sessionId, Guid userId, DateTimeOffset? expiresAt);

    [LoggerMessage(Level = LogLevel.Warning, Message = "Attempted to renew unknown session {SessionId}")]
    private static partial void LogRenewUnknownSession(ILogger logger, Guid sessionId);

    [LoggerMessage(Level = LogLevel.Debug, Message = "Renewed session {SessionId}")]
    private static partial void LogSessionRenewed(ILogger logger, Guid sessionId);

    [LoggerMessage(Level = LogLevel.Warning, Message = "Session {SessionId} not found in database")]
    private static partial void LogSessionNotFound(ILogger logger, Guid sessionId);

    [LoggerMessage(Level = LogLevel.Warning, Message = "Session {SessionId} expired at {ExpiresAt}")]
    private static partial void LogSessionExpired(ILogger logger, Guid sessionId, DateTimeOffset expiresAt);

    [LoggerMessage(Level = LogLevel.Information, Message = "Retrieved session {SessionId} for user {UserId}, authenticated: {IsAuthenticated}")]
    private static partial void LogSessionRetrieved(ILogger logger, Guid sessionId, string userId, bool isAuthenticated);

    [LoggerMessage(Level = LogLevel.Error, Message = "Failed to deserialize session ticket {SessionId}")]
    private static partial void LogSessionDeserializationFailed(ILogger logger, Exception ex, Guid sessionId);

    [LoggerMessage(Level = LogLevel.Debug, Message = "Removed session {SessionId}")]
    private static partial void LogSessionRemoved(ILogger logger, Guid sessionId);
}

internal sealed class SessionTicketData
{
    public List<ClaimData> Claims { get; set; } = new();
    public Dictionary<string, string?> Properties { get; set; } = new();
    public DateTimeOffset? IssuedUtc { get; set; }
    public DateTimeOffset? ExpiresUtc { get; set; }

    public static SessionTicketData FromAuthenticationTicket(AuthenticationTicket ticket)
    {
        var identity = ticket.Principal.Identities.FirstOrDefault()
            ?? throw new InvalidOperationException("The authentication ticket does not contain an identity.");

        return new SessionTicketData
        {
            Claims = identity.Claims.Select(c => new ClaimData
            {
                Type = c.Type,
                Value = c.Value,
                ValueType = c.ValueType,
                Issuer = c.Issuer,
            }).ToList(),
            Properties = ticket.Properties.Items?.ToDictionary(
                static kvp => kvp.Key,
                static kvp => kvp.Value) ?? new Dictionary<string, string?>(),
            IssuedUtc = ticket.Properties.IssuedUtc,
            ExpiresUtc = ticket.Properties.ExpiresUtc,
        };
    }

    public AuthenticationTicket ToAuthenticationTicket(string authenticationScheme)
    {
        var claims = Claims
            .Select(c => new Claim(c.Type, c.Value ?? string.Empty, c.ValueType, c.Issuer))
            .ToList();

        var identity = new ClaimsIdentity(claims, authenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        var properties = new AuthenticationProperties
        {
            IssuedUtc = IssuedUtc,
            ExpiresUtc = ExpiresUtc,
        };

        foreach (var property in Properties)
        {
            properties.Items[property.Key] = property.Value;
        }

        return new AuthenticationTicket(principal, properties, authenticationScheme);
    }
}

internal sealed class ClaimData
{
    public string Type { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string ValueType { get; set; } = ClaimValueTypes.String;
    public string Issuer { get; set; } = string.Empty;
}

