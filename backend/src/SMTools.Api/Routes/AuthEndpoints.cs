using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using SMTools.Identity.Models;
using SMTools.Identity.Services;

namespace SMTools.Api.Routes;

public static partial class AuthEndpoints
{
    public static RouteGroupBuilder MapAuthEndpoints(this RouteGroupBuilder api, IWebHostEnvironment environment)
    {
        var group = api.MapGroup("/auth");

        group.MapLoginEndpoints(environment);
        group.MapOAuthCallbacks();
        group.MapProfileEndpoints();
        group.MapDataEndpoints();

        return api;
    }

    public static string SanitizeReturnUrl(string? returnUrl)
    {
        if (string.IsNullOrWhiteSpace(returnUrl))
        {
            return "/";
        }

        if (returnUrl.StartsWith('/') && !returnUrl.StartsWith("//"))
        {
            return returnUrl;
        }

        return "/";
    }

    private static async Task RefreshAuthCookie(HttpContext context, User user)
    {
        var claims = IdentityService.CreateClaims(user);
        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        await context.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            principal,
            new AuthenticationProperties
            {
                IssuedUtc = DateTimeOffset.UtcNow,
                ExpiresUtc = DateTimeOffset.UtcNow.AddDays(7),
                IsPersistent = true
            });
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "User id {UserId} from session not found in database")]
    private static partial void LogUserNotFound(ILogger logger, Guid userId);

    [LoggerMessage(Level = LogLevel.Warning, Message = "Unauthorized request to /me. User authenticated: {IsAuthenticated}, Identity: {IdentityName}, Cookies: {Cookies}")]
    private static partial void LogMeUnauthorized(ILogger logger, bool isAuthenticated, string identityName, string cookies);
}
