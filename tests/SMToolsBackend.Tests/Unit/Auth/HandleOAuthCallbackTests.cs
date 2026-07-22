using System.Data.Common;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using SMTools.Abstractions;
using SMTools.Api.Routes;
using SMTools.Identity.Data;

namespace SMToolsBackend.Tests.Unit.Auth;

public sealed class HandleOAuthCallbackTests
{
    private static IdentityDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<IdentityDbContext>()
            .UseSqlite($"DataSource=file:mem-{Guid.NewGuid()}?mode=memory&cache=shared")
            .Options;
        var db = new IdentityDbContext(options);
        db.Database.EnsureCreated();
        return db;
    }

    private static HttpContext CreateMockHttpContext()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["FrontendOrigin"] = "http://localhost:8080"
            })
            .Build();

        var authService = Substitute.For<IAuthenticationService>();
        authService.SignInAsync(Arg.Any<HttpContext>(), Arg.Any<string>(), Arg.Any<ClaimsPrincipal>(), Arg.Any<AuthenticationProperties>())
            .Returns(Task.CompletedTask);

        var services = new ServiceCollection()
            .AddSingleton<IConfiguration>(config)
            .AddSingleton(authService)
            .BuildServiceProvider();

        var httpContext = Substitute.For<HttpContext>();
        httpContext.RequestServices.Returns(services);

        var response = Substitute.For<HttpResponse>();
        response.Headers.Returns(new HeaderDictionary());
        httpContext.Response.Returns(response);

        return httpContext;
    }

    private static ClaimsPrincipal CreatePrincipal(string provider, string email, string? emailVerified = null)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "test-provider-user-id"),
            new(ClaimTypes.Name, "Test User"),
            new(ClaimTypes.Email, email),
        };

        if (emailVerified is not null)
        {
            if (provider == "google")
            {
                claims.Add(new Claim("email_verified", emailVerified));
            }
            else if (provider == "github")
            {
                claims.Add(new Claim(SMToolsClaimTypes.EmailVerified, emailVerified));
            }
        }

        return new ClaimsPrincipal(new ClaimsIdentity(claims, "test"));
    }

    [Fact]
    public async Task Google_WithVerifiedEmail_Redirects_To_ReturnUrl()
    {
        using var db = CreateDbContext();
        var httpContext = CreateMockHttpContext();
        var principal = CreatePrincipal("google", "test@google.com", "true");

        await AuthEndpoints.HandleOAuthCallback("google", httpContext, db,
            NullLogger<Program>.Instance, principal, "/dashboard");

        httpContext.Response.Received(1).Redirect("http://localhost:8080/dashboard");
    }

    [Fact]
    public async Task Google_WithUnverifiedEmail_Redirects_To_Login_Error()
    {
        using var db = CreateDbContext();
        var httpContext = CreateMockHttpContext();
        var principal = CreatePrincipal("google", "test@google.com", "false");

        await AuthEndpoints.HandleOAuthCallback("google", httpContext, db,
            NullLogger<Program>.Instance, principal, "/dashboard");

        httpContext.Response.Received(1).Redirect("http://localhost:8080/login?error=unverified_email");
    }

    [Fact]
    public async Task GitHub_WithVerifiedEmail_Redirects_To_ReturnUrl()
    {
        using var db = CreateDbContext();
        var httpContext = CreateMockHttpContext();
        var principal = CreatePrincipal("github", "test@github.com", "true");

        await AuthEndpoints.HandleOAuthCallback("github", httpContext, db,
            NullLogger<Program>.Instance, principal, "/dashboard");

        httpContext.Response.Received(1).Redirect("http://localhost:8080/dashboard");
    }

    [Fact]
    public async Task GitHub_WithUnverifiedEmail_Redirects_To_Login_Error()
    {
        using var db = CreateDbContext();
        var httpContext = CreateMockHttpContext();
        var principal = CreatePrincipal("github", "test@github.com", "false");

        await AuthEndpoints.HandleOAuthCallback("github", httpContext, db,
            NullLogger<Program>.Instance, principal, "/dashboard");

        httpContext.Response.Received(1).Redirect("http://localhost:8080/login?error=unverified_email");
    }

    [Fact]
    public async Task Google_WithoutEmailVerifiedClaim_Redirects_To_Login_Error()
    {
        using var db = CreateDbContext();
        var httpContext = CreateMockHttpContext();
        var principal = CreatePrincipal("google", "test@google.com");

        await AuthEndpoints.HandleOAuthCallback("google", httpContext, db,
            NullLogger<Program>.Instance, principal, "/dashboard");

        httpContext.Response.Received(1).Redirect("http://localhost:8080/login?error=unverified_email");
    }

    [Fact]
    public async Task GitHub_WithoutEmailVerifiedClaim_Redirects_To_Login_Error()
    {
        using var db = CreateDbContext();
        var httpContext = CreateMockHttpContext();
        var principal = CreatePrincipal("github", "test@github.com");

        await AuthEndpoints.HandleOAuthCallback("github", httpContext, db,
            NullLogger<Program>.Instance, principal, "/dashboard");

        httpContext.Response.Received(1).Redirect("http://localhost:8080/login?error=unverified_email");
    }
}
