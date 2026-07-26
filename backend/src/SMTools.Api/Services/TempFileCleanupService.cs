using Microsoft.Extensions.Logging;

namespace SMTools.Api.Services;

public sealed partial class TempFileCleanupService : BackgroundService
{
    private static readonly TimeSpan CleanupInterval = TimeSpan.FromMinutes(30);
    private static readonly TimeSpan MaxAge = TimeSpan.FromHours(1);

    [LoggerMessage(Level = LogLevel.Information, Message = "Cleaned up stale export temp dir: {Dir}")]
    private partial void LogCleanedUp(string dir);

    [LoggerMessage(Level = LogLevel.Warning, Message = "Failed to clean up temp dir: {Dir}")]
    private partial void LogFailed(string dir, Exception ex);

    [LoggerMessage(Level = LogLevel.Warning, Message = "Error cleaning up stale export temp directories")]
    private partial void LogCleanupError(Exception ex);

    private readonly ILogger<TempFileCleanupService> _logger;

    public TempFileCleanupService(ILogger<TempFileCleanupService> logger)
    {
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                CleanupStaleTempDirs();
            }
            catch (Exception ex)
            {
                LogCleanupError(ex);
            }

            await Task.Delay(CleanupInterval, stoppingToken);
        }
    }

    private void CleanupStaleTempDirs()
    {
        var tempDir = Path.GetTempPath();
        var cutoff = DateTime.UtcNow - MaxAge;

        foreach (var dir in Directory.EnumerateDirectories(tempDir, "smtools-export-*"))
        {
            try
            {
                var created = Directory.GetCreationTimeUtc(dir);
                if (created < cutoff)
                {
                    Directory.Delete(dir, recursive: true);
                    LogCleanedUp(dir);
                }
            }
            catch (Exception ex)
            {
                LogFailed(dir, ex);
            }
        }
    }
}
