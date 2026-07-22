using FluentAssertions;

namespace SMToolsBackend.Tests.Integration.Endpoints;

public sealed class AuthEndpointsTests : IClassFixture<EndpointTestFactory>
{
    private readonly HttpClient _client;

    public AuthEndpointsTests(EndpointTestFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetMe_WithoutAuth_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync("/api/auth/me");

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Logout_WithoutAuth_ReturnsUnauthorized()
    {
        var response = await _client.PostAsync("/api/auth/logout", null);

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_WithUnknownProvider_ReturnsBadRequest()
    {
        var response = await _client.GetAsync("/api/auth/login/unknown?returnUrl=/");

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_WithUnconfiguredProvider_Returns503()
    {
        var response = await _client.GetAsync("/api/auth/login/github?returnUrl=/");

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.ServiceUnavailable);
    }
}
