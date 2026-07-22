using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using SMTools.Api.Setup;
using SMTools.PlanningPoker.Data;
using SMTools.Retro.Data;

namespace SMToolsBackend.Tests.Unit.Services;

public sealed class DbInitializerTests : IDisposable
{
    private readonly ServiceProvider _serviceProvider;
    private readonly PlanningPokerDbContext _ppDb;
    private readonly RetroDbContext _retroDb;

    public DbInitializerTests()
    {
        var services = new ServiceCollection();

        services.AddDbContext<PlanningPokerDbContext>(options =>
            options.UseSqlite($"DataSource=file:mem-{Guid.NewGuid()}?mode=memory&cache=shared"));

        services.AddDbContext<RetroDbContext>(options =>
            options.UseSqlite($"DataSource=file:mem-{Guid.NewGuid()}?mode=memory&cache=shared"));

        _serviceProvider = services.BuildServiceProvider();

        _ppDb = _serviceProvider.GetRequiredService<PlanningPokerDbContext>();
        _retroDb = _serviceProvider.GetRequiredService<RetroDbContext>();
    }

    public void Dispose()
    {
        _ppDb.Dispose();
        _retroDb.Dispose();
        _serviceProvider.Dispose();
    }

    [Fact]
    public async Task SeedAsync_Twice_Does_Not_Duplicate()
    {
        _ppDb.Database.EnsureCreated();
        _retroDb.Database.EnsureCreated();
        await DbInitializer.SeedAsync(_serviceProvider, NullLogger.Instance, CancellationToken.None);
        await DbInitializer.SeedAsync(_serviceProvider, NullLogger.Instance, CancellationToken.None);

        var decks = await _ppDb.PlanningPokerDecks.ToListAsync();
        var cards = await _ppDb.PlanningPokerCards.ToListAsync();
        var templates = await _retroDb.RetroTemplates.ToListAsync();
        var columns = await _retroDb.RetroColumns.ToListAsync();

        decks.Select(d => d.Key).Should().OnlyHaveUniqueItems();
        templates.Select(t => t.Key).Should().OnlyHaveUniqueItems();

        var cardKeys = cards.Select(c => (c.DeckId, c.Value, c.DisplayOrder));
        cardKeys.Should().OnlyHaveUniqueItems();

        var columnKeys = columns.Select(c => (c.TemplateId, c.Key));
        columnKeys.Should().OnlyHaveUniqueItems();

        decks.Should().NotBeEmpty();
        cards.Should().NotBeEmpty();
        templates.Should().NotBeEmpty();
        columns.Should().NotBeEmpty();
    }
}
