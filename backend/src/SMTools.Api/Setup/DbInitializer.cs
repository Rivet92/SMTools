using System.Reflection;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SMTools.PlanningPoker.Data;
using SMTools.PlanningPoker.Models;
using SMTools.Retro.Data;
using SMTools.Retro.Models;

#pragma warning disable CA1848 // LoggerMessage delegates are not needed for one-off seed logging

namespace SMTools.Api.Setup;

public static class DbInitializer
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private sealed record SeedCardDto(string Value, int DisplayOrder);
    private sealed record SeedDeckDto(string Key, bool IsDefault, List<SeedCardDto> Cards);
    private sealed record SeedColumnDto(string Key, int DisplayOrder, string Color, string Icon);
    private sealed record SeedTemplateDto(string Key, bool IsDefault, List<SeedColumnDto> Columns);

    private static string ReadEmbeddedResource(string name)
    {
        var assembly = Assembly.GetExecutingAssembly();
        using var stream = assembly.GetManifestResourceStream($"SMTools.Api.Data.Seed.{name}")
            ?? throw new InvalidOperationException($"Embedded resource 'SMTools.Api.Data.Seed.{name}' not found.");
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }

    public static async Task SeedAsync(IServiceProvider serviceProvider, ILogger logger, CancellationToken ct = default)
    {
        var ppDb = serviceProvider.GetRequiredService<PlanningPokerDbContext>();
        var retroDb = serviceProvider.GetRequiredService<RetroDbContext>();

        SeedDecks(ppDb);
        await ppDb.SaveChangesAsync(ct);

        try
        {
            SeedRetroTemplates(retroDb);
            await retroDb.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to seed retro templates (PP decks already seeded)");
        }
    }

    private static void SeedDecks(PlanningPokerDbContext db)
    {
        var json = ReadEmbeddedResource("decks.json");
        var decks = JsonSerializer.Deserialize<List<SeedDeckDto>>(json, JsonOptions)!;

        foreach (var deckDto in decks)
        {
            var existing = db.PlanningPokerDecks.FirstOrDefault(d => d.Key == deckDto.Key);

            PlanningPokerDeck deck;
            if (existing == null)
            {
                deck = new PlanningPokerDeck
                {
                    Key = deckDto.Key,
                    IsDefault = deckDto.IsDefault,
                };
                db.PlanningPokerDecks.Add(deck);
            }
            else
            {
                existing.IsDefault = deckDto.IsDefault;
                deck = existing;
            }

            var existingCards = db.PlanningPokerCards.Where(c => c.DeckId == deck.Id).ToList();

            var incomingCards = deckDto.Cards
                .Select(c => (c.Value, c.DisplayOrder))
                .ToHashSet();

            var cardsToDelete = existingCards
                .Where(ec => !incomingCards.Contains((ec.Value, ec.DisplayOrder)))
                .ToList();

            if (cardsToDelete.Count != 0)
                db.PlanningPokerCards.RemoveRange(cardsToDelete);

            var existingSet = existingCards
                .Select(ec => (ec.Value, ec.DisplayOrder))
                .ToHashSet();

            var cardsToAdd = deckDto.Cards
                .Where(c => !existingSet.Contains((c.Value, c.DisplayOrder)))
                .Select(c => new PlanningPokerCard
                {
                    Value = c.Value,
                    DisplayOrder = c.DisplayOrder,
                    DeckId = deck.Id,
                })
                .ToList();

            if (cardsToAdd.Count != 0)
                db.PlanningPokerCards.AddRange(cardsToAdd);
        }
    }

    private static void SeedRetroTemplates(RetroDbContext db)
    {
        var json = ReadEmbeddedResource("retro-templates.json");
        var templates = JsonSerializer.Deserialize<List<SeedTemplateDto>>(json, JsonOptions)!;

        foreach (var templateDto in templates)
        {
            var existing = db.RetroTemplates.FirstOrDefault(t => t.Key == templateDto.Key);

            RetroTemplate template;
            if (existing == null)
            {
                template = new RetroTemplate
                {
                    Key = templateDto.Key,
                    IsDefault = templateDto.IsDefault,
                };
                db.RetroTemplates.Add(template);
            }
            else
            {
                existing.IsDefault = templateDto.IsDefault;
                template = existing;
            }

            var existingColumns = db.RetroColumns.Where(c => c.TemplateId == template.Id).ToList();

            var incomingKeys = templateDto.Columns
                .Select(c => c.Key)
                .ToHashSet();

            var columnsToDelete = existingColumns
                .Where(ec => !incomingKeys.Contains(ec.Key))
                .ToList();

            if (columnsToDelete.Count != 0)
                db.RetroColumns.RemoveRange(columnsToDelete);

            foreach (var columnDto in templateDto.Columns)
            {
                var existingColumn = existingColumns.FirstOrDefault(ec => ec.Key == columnDto.Key);
                if (existingColumn == null)
                {
                    db.RetroColumns.Add(new RetroColumn
                    {
                        Key = columnDto.Key,
                        DisplayOrder = columnDto.DisplayOrder,
                        Color = columnDto.Color,
                        Icon = columnDto.Icon,
                        TemplateId = template.Id,
                    });
                }
                else
                {
                    existingColumn.DisplayOrder = columnDto.DisplayOrder;
                    existingColumn.Color = columnDto.Color;
                    existingColumn.Icon = columnDto.Icon;
                }
            }
        }
    }
}
