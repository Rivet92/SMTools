using Microsoft.EntityFrameworkCore;
using SMTools.Identity.Data;

namespace SMTools.Identity.Auth;

public sealed partial class SessionCleanupBackgroundService : BackgroundService
{
    private readonly IDbContextFactory<IdentityDbContext> _dbFactory;
    private readonly ILogger<SessionCleanupBackgroundService> _logger;
    private readonly TimeSpan _cleanupInterval = TimeSpan.FromHours(1);

    public SessionCleanupBackgroundService(IDbContextFactory<IdentityDbContext> dbFactory, ILogger<SessionCleanupBackgroundService> logger)
    {
        _dbFactory = dbFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(_cleanupInterval, stoppingToken);
                await CleanupExpiredSessionsAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                LogCleanupError(_logger, ex);
            }
        }
    }

    private async Task CleanupExpiredSessionsAsync(CancellationToken cancellationToken)
    {
        await using var db = await _dbFactory.CreateDbContextAsync();

        var deletedCount = await db.UserSessions
            .Where(s => s.ExpiresAt <= DateTimeOffset.UtcNow)
            .ExecuteDeleteAsync(cancellationToken);

        if (deletedCount > 0)
        {
            LogRemovedExpiredSessions(_logger, deletedCount);
        }
    }

    [LoggerMessage(Level = LogLevel.Error, Message = "Error cleaning up expired sessions")]
    private static partial void LogCleanupError(ILogger logger, Exception ex);

    [LoggerMessage(Level = LogLevel.Information, Message = "Removed {Count} expired user sessions")]
    private static partial void LogRemovedExpiredSessions(ILogger logger, int count);
}
