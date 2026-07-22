using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using SMTools.Abstractions;

namespace SMTools.Api.Setup;

public static class RateLimiterSetup
{
    public static IServiceCollection AddCustomRateLimiter(this IServiceCollection services, IConfiguration configuration)
    {
        var authLimit = configuration.GetValue<int>("RateLimiting:AuthenticatedUserPolicy:PermitLimit", 200);
        var authWindow = TimeSpan.FromMinutes(configuration.GetValue<int>("RateLimiting:AuthenticatedUserPolicy:WindowMinutes", 1));
        var publicLimit = configuration.GetValue<int>("RateLimiting:PublicPolicy:PermitLimit", 20);
        var publicWindow = TimeSpan.FromMinutes(configuration.GetValue<int>("RateLimiting:PublicPolicy:WindowMinutes", 1));

        services.AddRateLimiter(options =>
        {
            options.AddPolicy("AuthenticatedUserPolicy", context =>
            {
                var userId = context.User.FindFirst(SMToolsClaimTypes.UserId)?.Value;
                var partitionKey = userId ?? context.Connection.RemoteIpAddress?.ToString() ?? "anonymous";

                return RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: partitionKey,
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = authLimit,
                        Window = authWindow,
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0,
                    });
            });

            options.AddPolicy("PublicPolicy", context =>
            {
                var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

                return RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: ip,
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = publicLimit,
                        Window = publicWindow,
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0,
                    });
            });

            options.OnRejected = (context, token) =>
            {
                context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                context.HttpContext.Response.ContentType = "application/problem+json";
                return new ValueTask(context.HttpContext.Response.WriteAsJsonAsync(new
                {
                    status = StatusCodes.Status429TooManyRequests,
                    title = "Too many requests",
                    detail = "Please try again later.",
                }, token));
            };
        });

        return services;
    }
}
