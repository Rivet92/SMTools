using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SMTools.Identity.Data;
using SMTools.Kanban.Data;
using SMTools.Notes.Data;
using SMTools.PlanningPoker.Data;
using SMTools.Retro.Data;
using SMTools.Api.Data;

#pragma warning disable CA1848 // LoggerMessage delegates are not needed here

namespace SMTools.Api.Setup;

public static class MigrationExtensions
{
    public static async Task ApplyMigrationsWithRetryAsync(this IApplicationBuilder app, int maxRetries = 10, int delayMilliseconds = 2000)
    {
        using var scope = app.ApplicationServices.CreateScope();
        var sp = scope.ServiceProvider;
        var identityDb = sp.GetRequiredService<IdentityDbContext>();
        var notesDb = sp.GetRequiredService<NotesDbContext>();
        var ppDb = sp.GetRequiredService<PlanningPokerDbContext>();
        var retroDb = sp.GetRequiredService<RetroDbContext>();
        var kanbanDb = sp.GetRequiredService<KanbanDbContext>();
        var auditDb = sp.GetRequiredService<AuditDbContext>();
        var logger = sp.GetRequiredService<ILoggerFactory>().CreateLogger("SMTools.Api.Setup.MigrationExtensions");

        if (identityDb.Database.IsRelational() && identityDb.Database.ProviderName?.Contains("Npgsql") == true)
        {
            await MigrateDbAsync(identityDb, delayMilliseconds, maxRetries, logger);
            await MigrateDbAsync(notesDb, delayMilliseconds, maxRetries, logger);
            await MigrateDbAsync(ppDb, delayMilliseconds, maxRetries, logger);
            await MigrateDbAsync(retroDb, delayMilliseconds, maxRetries, logger);
            await MigrateDbAsync(kanbanDb, delayMilliseconds, maxRetries, logger);
            await MigrateDbAsync(auditDb, delayMilliseconds, maxRetries, logger);
        }
        else
        {
            identityDb.Database.EnsureCreated();
            notesDb.Database.EnsureCreated();
            ppDb.Database.EnsureCreated();
            retroDb.Database.EnsureCreated();
            kanbanDb.Database.EnsureCreated();
            auditDb.Database.EnsureCreated();
        }

        await DbInitializer.SeedAsync(sp, logger, CancellationToken.None);
    }

    private static async Task MigrateDbAsync(DbContext db, int delayMs, int maxRetries, ILogger logger)
    {
        for (int i = 0; i < maxRetries; i++)
        {
            try
            {
                await db.Database.MigrateAsync();
                return;
            }
            catch (Exception ex) when (i < maxRetries - 1)
            {
                logger.LogWarning(ex, "Migration retry {RetryCount}/{MaxRetries}", i + 1, maxRetries);
                await Task.Delay(delayMs);
            }
        }
    }
}
