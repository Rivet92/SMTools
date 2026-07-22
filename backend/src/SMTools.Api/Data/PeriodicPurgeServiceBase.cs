using Microsoft.EntityFrameworkCore;

namespace SMTools.Api.Data;

public abstract partial class PeriodicPurgeServiceBase<TLogger> : BackgroundService
{
    protected abstract TimeSpan InitialDelay { get; }
    protected abstract TimeSpan PurgeInterval { get; }
    protected abstract Task PurgeAsync(CancellationToken ct);
    protected abstract ILogger Logger { get; }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(InitialDelay, stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PurgeAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                LogPurgeError(Logger, ex);
            }

            await Task.Delay(PurgeInterval, stoppingToken);
        }
    }

    [LoggerMessage(Level = LogLevel.Error, Message = "Error purging records")]
    internal static partial void LogPurgeError(ILogger logger, Exception ex);
}
