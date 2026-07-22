using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using SMTools.Abstractions;
using SMTools.Identity.Data;
using SMTools.Identity.Models;
using SMTools.Identity.Services;

namespace SMTools.Api.Routes;

public static partial class AuthEndpoints
{
    public static RouteGroupBuilder MapOAuthCallbacks(this RouteGroupBuilder group)
    {
        return group;
    }

    public static async Task HandleOAuthCallback(
        string provider,
        HttpContext context,
        IdentityDbContext db,
        ILogger logger)
    {
        var authenticateResult = await context.AuthenticateAsync(provider);
        if (!authenticateResult.Succeeded || authenticateResult.Principal is null)
        {
            LogOAuthFailed(logger, provider, authenticateResult.Failure?.Message);
            var configuration = context.RequestServices.GetRequiredService<IConfiguration>();
            var frontendOrigin = GetFrontendOrigin(configuration);
            context.Response.Redirect($"{frontendOrigin}/?error={Uri.EscapeDataString($"{provider} login failed.")}");
            return;
        }

        var returnUrl = authenticateResult.Properties?.Items["returnUrl"] ?? "/";
        await HandleOAuthCallback(provider, context, db, logger, authenticateResult.Principal, returnUrl, context.RequestAborted);
    }

    public static async Task HandleOAuthCallback(
        string provider,
        HttpContext context,
        IdentityDbContext db,
        ILogger logger,
        ClaimsPrincipal principal,
        string returnUrl = "/",
        CancellationToken cancellationToken = default)
    {
        var configuration = context.RequestServices.GetRequiredService<IConfiguration>();
        var frontendOrigin = GetFrontendOrigin(configuration);

        var providerUserId = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        if (string.IsNullOrEmpty(providerUserId))
        {
            context.Response.Redirect($"{frontendOrigin}{returnUrl}?error=missing_user_identifier");
            return;
        }

        var name = principal.FindFirstValue(ClaimTypes.Name)
            ?? principal.FindFirstValue(ClaimTypes.GivenName)
            ?? principal.FindFirstValue("login")
            ?? "Unknown";
        var email = principal.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
        var avatarUrl = principal.FindFirstValue(SMToolsClaimTypes.AvatarUrl)
            ?? principal.FindFirstValue("picture")
            ?? principal.FindFirstValue("avatar_url")
            ?? string.Empty;

        if (!IsEmailVerified(principal, provider))
        {
            LogUnverifiedEmail(logger, provider, email);
            context.Response.Redirect($"{frontendOrigin}/login?error=unverified_email");
            return;
        }

        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Provider == provider && u.ProviderUserId == providerUserId, cancellationToken);

        if (user is null)
        {
            user = User.Create(provider, providerUserId, name, email, avatarUrl);
            db.Users.Add(user);
        }
        else
        {
            user.UpdateProfile(name, email, avatarUrl);
        }

        user.RecordLogin();
        await db.SaveChangesAsync(cancellationToken);

        var claims = IdentityService.CreateClaims(user);
        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var cookiePrincipal = new ClaimsPrincipal(identity);

        var redirectUrl = $"{frontendOrigin}{returnUrl}";
        LogDebugOAuthRedirect(logger, redirectUrl, frontendOrigin, returnUrl);

        await context.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            cookiePrincipal,
            new AuthenticationProperties
            {
                IsPersistent = true,
                RedirectUri = redirectUrl,
                ExpiresUtc = DateTimeOffset.UtcNow.AddDays(7),
            });

        context.Response.Redirect(redirectUrl);
    }

    private static bool IsEmailVerified(ClaimsPrincipal principal, string provider)
    {
        if (provider == "google")
        {
            var googleVerified = principal.FindFirstValue("email_verified");
            return string.Equals(googleVerified, "true", StringComparison.OrdinalIgnoreCase);
        }

        if (provider == "github")
        {
            var gitHubVerified = principal.FindFirstValue(SMToolsClaimTypes.EmailVerified);
            return string.Equals(gitHubVerified, "true", StringComparison.OrdinalIgnoreCase);
        }

        return false;
    }

    private static string? GetAuthenticationScheme(string provider) => provider.ToLowerInvariant() switch
    {
        "google" => "Google",
        "github" => "GitHub",
        _ => null,
    };

    private static bool IsProviderConfigured(string provider, IConfiguration configuration)
    {
        var section = configuration.GetSection($"Authentication:{provider}");
        var clientId = section["ClientId"];
        var clientSecret = section["ClientSecret"];
        return !string.IsNullOrWhiteSpace(clientId) && !string.IsNullOrWhiteSpace(clientSecret);
    }

    private static string GetFrontendOrigin(IConfiguration configuration)
    {
        var origin = configuration.GetValue<string>("FrontendOrigin")
                  ?? configuration.GetValue<string>("FRONTEND_ORIGIN")
                  ?? string.Empty;
        return string.IsNullOrWhiteSpace(origin) ? string.Empty : origin.TrimEnd('/');
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "{Provider} authentication failed: {FailureMessage}")]
    private static partial void LogOAuthFailed(ILogger logger, string provider, string? failureMessage);

    [LoggerMessage(Level = LogLevel.Warning, Message = "OAuth login rejected for {Provider}: email '{Email}' is not verified")]
    private static partial void LogUnverifiedEmail(ILogger logger, string provider, string email);

    [LoggerMessage(Level = LogLevel.Debug, Message = "OAuth redirect: '{RedirectUrl}' (origin='{Origin}', returnUrl='{ReturnUrl}')")]
    private static partial void LogDebugOAuthRedirect(ILogger logger, string redirectUrl, string origin, string returnUrl);
}
