using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using SMTools.Identity.Data;
using SMTools.Identity.Models;
using SMTools.Identity.Services;

namespace SMTools.Api.Routes;

public static partial class AuthEndpoints
{
    public static RouteGroupBuilder MapLoginEndpoints(this RouteGroupBuilder group, IWebHostEnvironment environment)
    {
        group.MapGet("/login/{provider}", (string provider, string? returnUrl, IConfiguration configuration) =>
        {
            var scheme = GetAuthenticationScheme(provider);
            if (scheme is null)
            {
                return Results.BadRequest($"Unsupported authentication provider '{provider}'.");
            }

            if (!IsProviderConfigured(provider, configuration))
            {
                return Results.Problem(
                    title: "Provider not configured",
                    detail: $"The '{provider}' authentication provider is not configured. Set the client id and secret.",
                    statusCode: StatusCodes.Status503ServiceUnavailable);
            }

            var frontendOrigin = GetFrontendOrigin(configuration);
            var redirectUrl = string.IsNullOrEmpty(frontendOrigin)
                ? $"/api/auth/callback/{provider}"
                : $"{frontendOrigin}/api/auth/callback/{provider}";

            var properties = new AuthenticationProperties
            {
                RedirectUri = redirectUrl,
                Items =
                {
                    { "LoginProvider", provider },
                    { "returnUrl", SanitizeReturnUrl(returnUrl) },
                },
            };

            return Results.Challenge(properties, new[] { scheme });
        })
        .WithName("Login")
        .WithTags("Auth")
        .AllowAnonymous()
        .RequireRateLimiting("PublicPolicy");

        group.MapPost("/logout", async (HttpContext context) =>
        {
            await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Results.Ok(new { message = "Signed out" });
        })
        .WithName("Logout")
        .WithTags("Auth")
        .Produces(StatusCodes.Status200OK)
        .RequireAuthorization();

        if (environment.IsDevelopment())
        {
            group.MapPost("/test-login", async (IIdentityService identityService, HttpContext context) =>
            {
                var user = await identityService.GetUserByExternalIdAsync("e2e", "e2e-test-user", CancellationToken.None);

                if (user is null)
                {
                    user = await identityService.CreateUserAsync("e2e", "e2e-test-user", "E2E Test User", "e2e@test.local", null, CancellationToken.None);
                }

                var claims = IdentityService.CreateClaims(user);
                var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                var principal = new ClaimsPrincipal(identity);

                await context.SignInAsync(
                    CookieAuthenticationDefaults.AuthenticationScheme,
                    principal,
                    new AuthenticationProperties
                    {
                        IsPersistent = true,
                        ExpiresUtc = DateTimeOffset.UtcNow.AddDays(7),
                    });

                return Results.Ok(IdentityService.MapUserResponse(user));
            })
            .WithName("TestLogin")
            .WithTags("Auth")
            .AllowAnonymous();
        }

        return group;
    }
}
