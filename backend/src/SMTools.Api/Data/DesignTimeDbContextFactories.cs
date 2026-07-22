using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using SMTools.Api.Setup;
using SMTools.Identity.Data;
using SMTools.Kanban.Data;
using SMTools.Notes.Data;
using SMTools.PlanningPoker.Data;
using SMTools.Retro.Data;

namespace SMTools.Api.Data;

public abstract class DesignTimeDbContextFactory<TContext> : IDesignTimeDbContextFactory<TContext>
    where TContext : DbContext
{
    protected abstract string Schema { get; }

    public TContext CreateDbContext(string[] args)
    {
        if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
            EnvLoader.TryLoadFromProjectRoot();

        EnvLoader.EnsureConnectionString();

        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? throw new InvalidOperationException("ConnectionStrings__DefaultConnection is not configured.");

        var builder = new DbContextOptionsBuilder<TContext>();
        builder.UseNpgsql(connectionString, npgsql =>
            npgsql.MigrationsHistoryTable("__EFMigrationsHistory", Schema));

        return (TContext)Activator.CreateInstance(typeof(TContext), builder.Options)!;
    }
}

public sealed class IdentityDesignTimeDbContextFactory : DesignTimeDbContextFactory<IdentityDbContext>
{
    protected override string Schema => "identity";
}

public sealed class NotesDesignTimeDbContextFactory : DesignTimeDbContextFactory<NotesDbContext>
{
    protected override string Schema => "notes";
}

public sealed class PlanningPokerDesignTimeDbContextFactory : DesignTimeDbContextFactory<PlanningPokerDbContext>
{
    protected override string Schema => "planningpoker";
}

public sealed class RetroDesignTimeDbContextFactory : DesignTimeDbContextFactory<RetroDbContext>
{
    protected override string Schema => "retro";
}

public sealed class KanbanDesignTimeDbContextFactory : DesignTimeDbContextFactory<KanbanDbContext>
{
    protected override string Schema => "kanban";
}
