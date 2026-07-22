using FluentAssertions;

namespace SMToolsBackend.Tests.Integration.Endpoints;

public sealed class NotesEndpointsTests : IClassFixture<EndpointTestFactory>
{
    private readonly HttpClient _client;

    public NotesEndpointsTests(EndpointTestFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetNotes_WithoutAuth_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync("/api/notes?page=1&pageSize=10");

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateNote_WithoutAuth_ReturnsUnauthorized()
    {
        var response = await _client.PostAsync("/api/notes",
            new StringContent("{\"title\":\"test\"}", System.Text.Encoding.UTF8, "application/json"));

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UpdateNote_WithoutAuth_ReturnsUnauthorized()
    {
        var response = await _client.PutAsync($"/api/notes/{Guid.NewGuid()}",
            new StringContent("{\"title\":\"updated\"}", System.Text.Encoding.UTF8, "application/json"));

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DeleteNote_WithoutAuth_ReturnsUnauthorized()
    {
        var response = await _client.DeleteAsync($"/api/notes/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ToggleArchive_WithoutAuth_ReturnsUnauthorized()
    {
        var response = await _client.PutAsync($"/api/notes/{Guid.NewGuid()}/archive", null);

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ReorderNotes_WithoutAuth_ReturnsUnauthorized()
    {
        var response = await _client.PutAsync("/api/notes/reorder",
            new StringContent("{\"updates\":[]}", System.Text.Encoding.UTF8, "application/json"));

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Unauthorized);
    }
}
