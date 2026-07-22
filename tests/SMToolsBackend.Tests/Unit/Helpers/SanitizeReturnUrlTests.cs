using FluentAssertions;
using SMTools.Api.Routes;

namespace SMToolsBackend.Tests.Unit.Helpers;

public sealed class SanitizeReturnUrlTests
{
    [Fact]
    public void Should_Return_Root_When_Null()
    {
        AuthEndpoints.SanitizeReturnUrl(null).Should().Be("/");
    }

    [Fact]
    public void Should_Return_Root_When_Empty()
    {
        AuthEndpoints.SanitizeReturnUrl("").Should().Be("/");
    }

    [Fact]
    public void Should_Return_Root_When_Whitespace()
    {
        AuthEndpoints.SanitizeReturnUrl("   ").Should().Be("/");
    }

    [Fact]
    public void Should_Return_Same_When_Relative_Path()
    {
        AuthEndpoints.SanitizeReturnUrl("/dashboard").Should().Be("/dashboard");
    }

    [Fact]
    public void Should_Return_Root_When_External_Url()
    {
        AuthEndpoints.SanitizeReturnUrl("https://evil.com").Should().Be("/");
    }

    [Fact]
    public void Should_Return_Root_When_Double_Slash()
    {
        AuthEndpoints.SanitizeReturnUrl("//evil.com").Should().Be("/");
    }

    [Fact]
    public void Should_Return_Root_When_Backslashes()
    {
        AuthEndpoints.SanitizeReturnUrl("\\\\evil\\path").Should().Be("/");
    }

    [Fact]
    public void Should_Return_Root_When_Javascript()
    {
        AuthEndpoints.SanitizeReturnUrl("javascript:alert(1)").Should().Be("/");
    }

    [Fact]
    public void Should_Return_Root_When_Mailto()
    {
        AuthEndpoints.SanitizeReturnUrl("mailto:test@evil.com").Should().Be("/");
    }
}
