using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;

namespace SMTools.Api.Middleware;

public sealed class CsrfMiddleware
{
    private readonly RequestDelegate _next;

    public CsrfMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (HttpMethods.IsPost(context.Request.Method) ||
            HttpMethods.IsPut(context.Request.Method) ||
            HttpMethods.IsPatch(context.Request.Method) ||
            HttpMethods.IsDelete(context.Request.Method))
        {
            var endpoint = context.GetEndpoint();
            var allowAnonymous = endpoint?.Metadata.GetMetadata<AllowAnonymousAttribute>() is not null;

            if (!allowAnonymous && context.User.Identity?.IsAuthenticated == true)
            {
                var customHeader = context.Request.Headers["X-CSRF-Protection"].FirstOrDefault();
                if (customHeader != "1")
                {
                    context.Response.StatusCode = 400;
                    await context.Response.WriteAsJsonAsync(new { error = "Missing CSRF protection header." });
                    return;
                }
            }
        }

        await _next(context);
    }
}
