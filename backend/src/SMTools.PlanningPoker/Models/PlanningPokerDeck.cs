namespace SMTools.PlanningPoker.Models;

public sealed class PlanningPokerDeck
{
    public Guid Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public bool IsDefault { get; set; }

    public ICollection<PlanningPokerCard> Cards { get; set; } = new List<PlanningPokerCard>();
}
