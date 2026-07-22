using FluentValidation;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.Options;
using SMTools.Abstractions;
using SMTools.Identity.Auth;
using SMTools.Identity.Data;
using SMTools.Identity.Services;
using SMTools.Identity.Validation;

namespace SMTools.Identity.Setup;

public static class IdentityServiceExtensions
{
    public static IServiceCollection AddIdentityServices(
        this IServiceCollection services, IConfiguration config, IWebHostEnvironment env)
    {
        var connectionString = config.GetConnectionString("DefaultConnection");
        services.AddModuleDbContext<IdentityDbContext>(connectionString!, env, "identity");

        services.AddScoped<IIdentityService, IdentityService>();
        services.AddValidatorsFromAssemblyContaining<UpdateProfileRequestValidator>();

        services.AddSingleton<DatabaseTicketStore>();
        services.AddSingleton<IPostConfigureOptions<CookieAuthenticationOptions>, ConfigureCookieSessionStore>();
        services.AddHostedService<SessionCleanupBackgroundService>();

        return services;
    }
}
