using FluentAssertions;

namespace SMToolsBackend.Tests.Integration.Endpoints;

public sealed class PlanningPokerEndpointsTests : IClassFixture<EndpointTestFactory>
{
    private readonly HttpClient _client;

    public PlanningPokerEndpointsTests(EndpointTestFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetDecks_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/planningpoker/decks");

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();
    }
}
