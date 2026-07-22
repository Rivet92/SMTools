using System.Text;
using Microsoft.Extensions.Options;

namespace SMTools.Api.Middleware;

public sealed class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;
    private readonly string _imgSrc;

    public SecurityHeadersMiddleware(RequestDelegate next, IOptions<CspOptions> cspOptions)
    {
        _next = next;
        var sources = cspOptions.Value.ImgSources;
        _imgSrc = sources.Length > 0 ? string.Join(" ", sources) : "";
    }

    public async Task InvokeAsync(HttpContext context)
    {
        context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
        context.Response.Headers.Append("X-Frame-Options", "DENY");
        context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
        context.Response.Headers.Append("X-Permitted-Cross-Domain-Policies", "none");

        var csp = new StringBuilder()
            .Append("default-src 'self'; ")
            .Append("script-src 'self'; ")
            .Append("style-src 'self' 'unsafe-inline'; ")
            .Append("img-src 'self' data:")
            .Append(string.IsNullOrEmpty(_imgSrc) ? "" : " ")
            .Append(_imgSrc)
            .Append("; ")
            .Append("font-src 'self'; ")
            .Append("connect-src 'self' ws:; ")
            .Append("base-uri 'self'; ")
            .Append("form-action 'self'; ")
            .Append("frame-ancestors 'none'; ")
            .Append("object-src 'none';")
            .ToString();

        context.Response.Headers.Append("Content-Security-Policy", csp);

        await _next(context);
    }
}
