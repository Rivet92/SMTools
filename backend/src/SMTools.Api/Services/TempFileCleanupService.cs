#pragma warning disable CA1848 // Not performance-critical — runs every 30 minutes

namespace SMTools.Api.Services;

public sealed class TempFileCleanupService : BackgroundService
{
    private readonly ILogger<TempFileCleanupService> _logger;
    private static readonly TimeSpan CleanupInterval = TimeSpan.FromMinutes(30);
    private static readonly TimeSpan MaxAge = TimeSpan.FromHours(1);

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
                _logger.LogWarning(ex, "Error cleaning up stale export temp directories");
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
                    _logger.LogInformation("Cleaned up stale export temp dir: {Dir}", dir);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to clean up temp dir: {Dir}", dir);
            }
        }
    }
}
