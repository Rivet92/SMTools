using System.Net;
using Microsoft.AspNetCore.HttpOverrides;
using SMTools.Abstractions;
using SMTools.Api.Middleware;

namespace SMTools.Api.Setup;

public static class MiddlewareExtensions
{
    public static IApplicationBuilder UseApplicationMiddleware(this IApplicationBuilder app, IWebHostEnvironment environment)
    {
        app.UseForwardedHeaders(new ForwardedHeadersOptions
        {
            ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost,
            KnownProxies = { IPAddress.Loopback, IPAddress.IPv6Loopback },
        });

        if (!environment.IsDevelopment())
        {
            app.UseHsts();
        }

        app.UseMiddleware<SecurityHeadersMiddleware>();
        app.UseMiddleware<ExceptionHandlingMiddleware>();
        app.UseCors("AllowFrontend");
        app.UseMiddleware<CsrfMiddleware>();
        app.UseAuthentication();
        app.UseAuthorization();

        app.Use(async (context, next) =>
        {
            var accessor = context.RequestServices.GetRequiredService<ICurrentUserAccessor>();
            var remoteIp = context.Connection.RemoteIpAddress;
            var ip = remoteIp is not null
                ? remoteIp.IsIPv4MappedToIPv6 ? remoteIp.MapToIPv4().ToString()
                  : IPAddress.IsLoopback(remoteIp) ? "127.0.0.1"
                  : remoteIp.ToString()
                : null;
            accessor.SetUser(ClaimsHelper.TryGetUserId(context.User), ip);
            await next(context);
        });

        app.UseRateLimiter();

        app.UseDefaultFiles();
        app.UseStaticFiles();

        return app;
    }
}
