using System.Text.Json.Serialization;

namespace SMTools.PlanningPoker.Models;

public sealed class PlanningPokerCard
{
    public Guid Id { get; set; }
    public string Value { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }

    public Guid DeckId { get; set; }

    [JsonIgnore]
    public PlanningPokerDeck Deck { get; set; } = null!;
}
