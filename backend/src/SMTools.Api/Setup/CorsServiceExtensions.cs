namespace SMTools.Api.Setup;

public static class CorsServiceExtensions
{
    private const string DefaultFrontendOrigin = "http://localhost:8080";

    public static IServiceCollection AddFrontendCors(this IServiceCollection services, IConfiguration configuration)
    {
        var frontendOrigin = configuration.GetValue<string>("FrontendOrigin")
                          ?? configuration.GetValue<string>("FRONTEND_ORIGIN")
                          ?? DefaultFrontendOrigin;

        services.AddCors(options =>
        {
            options.AddPolicy("AllowFrontend", policy =>
            {
                policy.WithOrigins(frontendOrigin)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

        return services;
    }
}
