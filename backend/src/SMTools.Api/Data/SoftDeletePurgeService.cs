using Microsoft.EntityFrameworkCore;
using SMTools.Abstractions;
using SMTools.Kanban.Data;
using SMTools.Kanban.Models;
using SMTools.PlanningPoker.Data;
using SMTools.PlanningPoker.Models;
using SMTools.Retro.Data;
using SMTools.Retro.Models;

namespace SMTools.Api.Data;

public sealed partial class SoftDeletePurgeService : PeriodicPurgeServiceBase<SoftDeletePurgeService>
{
    private readonly IDbContextFactory<RetroDbContext> _retroFactory;
    private readonly IDbContextFactory<KanbanDbContext> _kanbanFactory;
    private readonly IDbContextFactory<PlanningPokerDbContext> _planningPokerFactory;
    private readonly int _retentionDays;

    public SoftDeletePurgeService(
        IDbContextFactory<RetroDbContext> retroFactory,
        IDbContextFactory<KanbanDbContext> kanbanFactory,
        IDbContextFactory<PlanningPokerDbContext> planningPokerFactory,
        ILogger<SoftDeletePurgeService> logger,
        IConfiguration configuration)
    {
        _retroFactory = retroFactory;
        _kanbanFactory = kanbanFactory;
        _planningPokerFactory = planningPokerFactory;
        Logger = logger;
        PurgeInterval = TimeSpan.FromHours(configuration.GetValue<int>("SoftDelete:PurgeIntervalHours", 24));
        _retentionDays = configuration.GetValue<int>("SoftDelete:RetentionDays", 30);
    }

    protected override TimeSpan InitialDelay => TimeSpan.FromMinutes(5);
    protected override TimeSpan PurgeInterval { get; }
    protected override ILogger Logger { get; }
    protected override Task PurgeAsync(CancellationToken ct) => PurgeSoftDeletedRecordsAsync(ct);

    private async Task PurgeSoftDeletedRecordsAsync(CancellationToken ct)
    {
        var cutoff = DateTimeOffset.UtcNow.AddDays(-_retentionDays);
        var totalDeleted = 0;

        await using var retroDb = await _retroFactory.CreateDbContextAsync(ct);
        totalDeleted += await PurgeSetAsync<RetroCard>(retroDb, cutoff, ct);
        totalDeleted += await PurgeSetAsync<RetroVote>(retroDb, cutoff, ct);

        await using var kanbanDb = await _kanbanFactory.CreateDbContextAsync(ct);
        totalDeleted += await PurgeSetAsync<KanbanCard>(kanbanDb, cutoff, ct);
        totalDeleted += await PurgeSetAsync<KanbanCardComment>(kanbanDb, cutoff, ct);

        await using var ppDb = await _planningPokerFactory.CreateDbContextAsync(ct);
        totalDeleted += await PurgeSetAsync<PlanningPokerVote>(ppDb, cutoff, ct);

        if (totalDeleted > 0)
            LogPurgedRecords(Logger, totalDeleted);
    }

    private static async Task<int> PurgeSetAsync<T>(DbContext db, DateTimeOffset cutoff, CancellationToken ct)
        where T : class, ISoftDeletable
    {
        return await db.Set<T>()
            .Where(e => e.DeletedAt != null && e.DeletedAt < cutoff)
            .ExecuteDeleteAsync(ct);
    }

    [LoggerMessage(Level = LogLevel.Information, Message = "Purged {Count} soft-deleted records")]
    private static partial void LogPurgedRecords(ILogger logger, int count);
}
