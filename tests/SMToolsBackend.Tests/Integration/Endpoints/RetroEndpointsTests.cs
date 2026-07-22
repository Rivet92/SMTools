using FluentAssertions;

namespace SMToolsBackend.Tests.Integration.Endpoints;

public sealed class RetroEndpointsTests : IClassFixture<EndpointTestFactory>
{
    private readonly HttpClient _client;

    public RetroEndpointsTests(EndpointTestFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetTemplates_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/retro/templates");

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();
    }
}
