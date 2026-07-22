using System.Net;
using FluentAssertions;

namespace SMToolsBackend.Tests.Integration.Endpoints;

public sealed class FallbackEndpointsTests : IClassFixture<EndpointTestFactory>
{
    private readonly HttpClient _client;

    public FallbackEndpointsTests(EndpointTestFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Get_UnknownApiRoute_Returns404ProblemDetails()
    {
        var response = await _client.GetAsync("/api/inexistente");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task Post_UnknownApiRoute_Returns404()
    {
        var response = await _client.PostAsync("/api/inexistente",
            new StringContent("{}", System.Text.Encoding.UTF8, "application/json"));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Delete_UnknownApiRoute_Returns404()
    {
        var response = await _client.DeleteAsync("/api/inexistente");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Get_UnknownHubsRoute_Returns404()
    {
        var response = await _client.GetAsync("/hubs/inexistente");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task ExistingApiRoute_StillWorks()
    {
        // Known route should still return unauthorized (not 404)
        var response = await _client.GetAsync("/api/notes?page=1&pageSize=10");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
