using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OAuth;
using Microsoft.Extensions.Options;
using SMTools.Identity.Auth;
using SMTools.Identity.Data;
using SMTools.Api.Routes;
using SMTools.Abstractions;

namespace SMTools.Api.Setup;

public static partial class AuthenticationServiceExtensions
{
    public static IServiceCollection AddExternalAuthentication(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        services.AddDataProtection();

        var authBuilder = services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
            .AddCookie(options =>
            {
                options.Cookie.Name = "SMTools.Session";
                options.Cookie.HttpOnly = true;
                options.Cookie.SameSite = SameSiteMode.Lax;
                if (environment.IsDevelopment())
                {
                    options.Cookie.SecurePolicy = CookieSecurePolicy.None;
                    options.Cookie.Domain = "localhost";
                }
                else
                {
                    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                }
                options.ExpireTimeSpan = TimeSpan.FromDays(7);
                options.SlidingExpiration = true;

                // API requests should receive 401/403 instead of redirects to a login page.
                options.Events.OnRedirectToLogin = context =>
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return Task.CompletedTask;
                };
                options.Events.OnRedirectToAccessDenied = context =>
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    return Task.CompletedTask;
                };
                options.Events.OnSigningIn = context =>
                {
                    var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                    if (logger.IsEnabled(LogLevel.Information))
                    {
                        var userName = context.Principal?.Identity?.Name;
                        var sessionId = context.Properties.GetString(".session.id");
                        LogSigningIn(logger, userName, sessionId);
                    }
                    return Task.CompletedTask;
                };
            });

        var googleClientId = configuration["Authentication:Google:ClientId"];
        var googleClientSecret = configuration["Authentication:Google:ClientSecret"];
        if (!string.IsNullOrWhiteSpace(googleClientId) && !string.IsNullOrWhiteSpace(googleClientSecret))
        {
            authBuilder.AddGoogle(options =>
            {
                options.ClientId = googleClientId;
                options.ClientSecret = googleClientSecret;
                options.CallbackPath = "/api/auth/callback/google";
                options.SignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;

                options.ClaimActions.MapJsonKey("picture", "picture");
                options.ClaimActions.MapJsonKey("email_verified", "email_verified");

                options.Events.OnTicketReceived = async context =>
                {
                    var db = context.HttpContext.RequestServices.GetRequiredService<IdentityDbContext>();
                    var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                    var returnUrl = context.Properties?.Items["returnUrl"] ?? "/";
                    await AuthEndpoints.HandleOAuthCallback("google", context.HttpContext, db, logger, context.Principal!, returnUrl, context.HttpContext.RequestAborted);
                    context.HandleResponse();
                };
            });
        }

        var gitHubClientId = configuration["Authentication:GitHub:ClientId"];
        var gitHubClientSecret = configuration["Authentication:GitHub:ClientSecret"];
        if (!string.IsNullOrWhiteSpace(gitHubClientId) && !string.IsNullOrWhiteSpace(gitHubClientSecret))
        {
            authBuilder.AddOAuth("GitHub", "GitHub", options =>
            {
                options.ClientId = gitHubClientId;
                options.ClientSecret = gitHubClientSecret;
                options.CallbackPath = "/api/auth/callback/github";
                options.SignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;

                options.AuthorizationEndpoint = "https://github.com/login/oauth/authorize";
                options.TokenEndpoint = "https://github.com/login/oauth/access_token";
                options.UserInformationEndpoint = "https://api.github.com/user";

                options.Scope.Add("read:user");
                options.Scope.Add("user:email");

                options.ClaimActions.MapJsonKey(ClaimTypes.NameIdentifier, "id");
                options.ClaimActions.MapJsonKey(ClaimTypes.Name, "login");
                options.ClaimActions.MapJsonKey(ClaimTypes.Email, "email");
                options.ClaimActions.MapJsonKey(SMToolsClaimTypes.AvatarUrl, "avatar_url");

                options.Events.OnCreatingTicket = async context =>
                {
                    var request = new HttpRequestMessage(HttpMethod.Get, context.Options.UserInformationEndpoint);
                    request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", context.AccessToken);

                    var response = await context.Backchannel.SendAsync(request, context.HttpContext.RequestAborted);
                    response.EnsureSuccessStatusCode();

                    using var user = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
                    context.RunClaimActions(user.RootElement);

                    await TryAddGitHubEmailAsync(context);
                };

                options.Events.OnTicketReceived = async context =>
                {
                    var db = context.HttpContext.RequestServices.GetRequiredService<IdentityDbContext>();
                    var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                    var returnUrl = context.Properties?.Items["returnUrl"] ?? "/";
                    await AuthEndpoints.HandleOAuthCallback("github", context.HttpContext, db, logger, context.Principal!, returnUrl, context.HttpContext.RequestAborted);
                    context.HandleResponse();
                };
            });
        }

        return services;
    }

    [LoggerMessage(Level = LogLevel.Information, Message = "Signing in user '{UserName}' with session id '{SessionId}'")]
    private static partial void LogSigningIn(ILogger logger, string? userName, string? sessionId);

    private static async Task TryAddGitHubEmailAsync(OAuthCreatingTicketContext context)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "https://api.github.com/user/emails");
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", context.AccessToken);

        var response = await context.Backchannel.SendAsync(request, context.HttpContext.RequestAborted);
        if (!response.IsSuccessStatusCode)
        {
            return;
        }

        using var document = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
        var primaryEmail = document.RootElement.EnumerateArray()
            .FirstOrDefault(e => e.TryGetProperty("primary", out var primary) && primary.GetBoolean());

        if (primaryEmail.ValueKind == JsonValueKind.Undefined || context.Identity is null)
        {
            return;
        }

        var email = primaryEmail.GetProperty("email").GetString();
        var verified = primaryEmail.TryGetProperty("verified", out var verifiedProp) && verifiedProp.GetBoolean();

        if (!string.IsNullOrEmpty(email))
        {
            context.Identity.AddClaim(new Claim(ClaimTypes.Email, email));
            context.Identity.AddClaim(new Claim(SMToolsClaimTypes.EmailVerified, verified ? "true" : "false"));
        }
    }
}
