using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using SMTools.Abstractions;
using SMTools.Abstractions.Exceptions;
using SMTools.Abstractions.Hubs;
using SMTools.Api.Data;
using SMTools.Api.Middleware;
using SMTools.Identity.Data;
using SMTools.Kanban.Data;
using SMTools.Kanban.Hubs;
using SMTools.Notes.Data;
using SMTools.PlanningPoker.Data;
using SMTools.PlanningPoker.Hubs;
using SMTools.Retro.Data;
using SMTools.Retro.Hubs;
using SMTools.Identity.Setup;
using SMTools.Notes.Setup;
using SMTools.PlanningPoker.Setup;
using SMTools.Retro.Setup;
using SMTools.Kanban.Setup;
using SMTools.Api.Services;

namespace SMTools.Api.Setup;

public static class ApplicationServiceExtensions
{
    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        services.AddOpenApi(options =>
        {
            options.AddDocumentTransformer((document, context, cancellationToken) =>
            {
                document.Info = new()
                {
                    Title = "SMTools API",
                    Version = "v1",
                    Description = "API for SMTools — Planning Poker, Retrospectives, Kanban, Notes"
                };
                return Task.CompletedTask;
            });
        });
        services.AddMemoryCache();
        services.AddSingleton<IRoomVersionStore, RoomVersionStore>();

        services.AddCustomRateLimiter(configuration);

        services.Configure<CspOptions>(options =>
        {
            var section = configuration.GetSection("Csp");
            section.Bind(options);
            if (options.ImgSources is null || options.ImgSources.Length == 0)
            {
                options.ImgSources = ["https://*.googleusercontent.com", "https://avatars.githubusercontent.com"];
            }
        });

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserAccessor, CurrentUserAccessor>();
        services.AddScoped<ISaveChangesInterceptor>(sp =>
        {
            var factory = sp.GetRequiredService<IDbContextFactory<AuditDbContext>>();
            var userAccessor = sp.GetRequiredService<ICurrentUserAccessor>();
            var logger = sp.GetRequiredService<ILogger<AuditInterceptor>>();
            return new AuditInterceptor(userAccessor, factory, logger);
        });

        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddHealthChecks()
            .AddCheck("postgres", new PostgresHealthCheck(connectionString!), tags: ["ready"]);

        if (environment.IsEnvironment("Testing"))
        {
            var suffix = Guid.NewGuid().ToString("N")[..8];

            var identityOptions = new DbContextOptionsBuilder<IdentityDbContext>();
            identityOptions.UseSqlite($"DataSource=file:mem-id-{suffix}?mode=memory&cache=shared");
            services.AddSingleton(identityOptions.Options);
            services.AddScoped<IdentityDbContext>();
            services.AddDbContextFactory<IdentityDbContext>();

            services.AddDbContext<NotesDbContext>(options =>
                options.UseSqlite($"DataSource=file:mem-notes-{suffix}?mode=memory&cache=shared"));

            var ppOptions = new DbContextOptionsBuilder<PlanningPokerDbContext>();
            ppOptions.UseSqlite($"DataSource=file:mem-pp-{suffix}?mode=memory&cache=shared");
            services.AddSingleton(ppOptions.Options);
            services.AddScoped<PlanningPokerDbContext>();
            services.AddDbContextFactory<PlanningPokerDbContext>();

            var retroOptions = new DbContextOptionsBuilder<RetroDbContext>();
            retroOptions.UseSqlite($"DataSource=file:mem-retro-{suffix}?mode=memory&cache=shared");
            services.AddSingleton(retroOptions.Options);
            services.AddScoped<RetroDbContext>();
            services.AddDbContextFactory<RetroDbContext>();

            var kanbanOptions = new DbContextOptionsBuilder<KanbanDbContext>();
            kanbanOptions.UseSqlite($"DataSource=file:mem-kanban-{suffix}?mode=memory&cache=shared");
            services.AddSingleton(kanbanOptions.Options);
            services.AddScoped<KanbanDbContext>();
            services.AddDbContextFactory<KanbanDbContext>();

            services.AddDbContext<AuditDbContext>(options =>
                options.UseSqlite($"DataSource=file:mem-audit-{suffix}?mode=memory&cache=shared"));
            services.AddDbContextFactory<AuditDbContext>(options =>
                options.UseSqlite($"DataSource=file:mem-audit-{suffix}?mode=memory&cache=shared"));
        }
        else
        {
            var auditOptionsBuilder = new DbContextOptionsBuilder<AuditDbContext>();
            auditOptionsBuilder.UseNpgsql(connectionString, npgsql =>
                npgsql.MigrationsHistoryTable("__EFMigrationsHistory", "audit"));
            services.AddSingleton(auditOptionsBuilder.Options);
            services.AddScoped<AuditDbContext>();
            services.AddDbContextFactory<AuditDbContext>();
        }

        services.AddSingleton<MasterDataCache>();
        services.AddScoped<UserDataService>();

        services.AddScoped<SignalRRoomClosedNotifier<PlanningPokerHub>>();
        services.AddScoped<SignalRRoomClosedNotifier<RetroHub>>();
        services.AddScoped<SignalRRoomClosedNotifier<KanbanHub>>();

        services.Configure<HubOptions>(options =>
        {
            options.AddFilter<DomainExceptionHubFilter>();
            options.AddFilter<AuditContextHubFilter>();
        });

        services.AddSignalR()
            .AddHubOptions<PlanningPokerHub>(options =>
            {
                if (environment.IsDevelopment())
                    options.EnableDetailedErrors = true;
            })
            .AddHubOptions<RetroHub>(options =>
            {
                if (environment.IsDevelopment())
                    options.EnableDetailedErrors = true;
            })
            .AddHubOptions<KanbanHub>(options =>
            {
                if (environment.IsDevelopment())
                    options.EnableDetailedErrors = true;
            });

        services.AddIdentityServices(configuration, environment);
        services.AddNotesServices(configuration, environment);
        services.AddPlanningPokerServices(connectionString!, environment);
        services.AddRetroServices(connectionString!, environment);
        services.AddKanbanServices(connectionString!, environment);

        services.AddHostedService<SoftDeletePurgeService>();
        services.AddHostedService<AuditPurgeService>();
        services.AddHostedService<TempFileCleanupService>();

        services.AddFrontendCors(configuration);
        services.AddExternalAuthentication(configuration, environment);
        services.AddAuthorization();

        return services;
    }
}
