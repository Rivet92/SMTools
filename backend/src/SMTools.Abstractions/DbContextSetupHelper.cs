using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace SMTools.Abstractions;

public static class DbContextSetupHelper
{
    public static IServiceCollection AddModuleDbContext<TDbContext>(
        this IServiceCollection services,
        string connectionString,
        IHostEnvironment env,
        string schemaName)
        where TDbContext : DbContext
    {
        if (!env.IsEnvironment("Testing"))
        {
            var optionsBuilder = new DbContextOptionsBuilder<TDbContext>();
            optionsBuilder.UseNpgsql(connectionString, npgsql =>
                npgsql.MigrationsHistoryTable("__EFMigrationsHistory", schemaName));
            services.AddSingleton(optionsBuilder.Options);

            services.AddScoped<TDbContext>(sp =>
            {
                var baseOptions = sp.GetRequiredService<DbContextOptions<TDbContext>>();
                var interceptor = sp.GetService<ISaveChangesInterceptor>();
                if (interceptor is not null)
                {
                    var builder = new DbContextOptionsBuilder<TDbContext>(baseOptions);
                    builder.AddInterceptors(interceptor);
                    return ActivatorUtilities.CreateInstance<TDbContext>(sp, builder.Options);
                }
                return ActivatorUtilities.CreateInstance<TDbContext>(sp, baseOptions);
            });

            services.AddDbContextFactory<TDbContext>();
        }

        return services;
    }
}
