using System.Text.Json.Serialization;
using SMTools.Abstractions.Exceptions;


namespace SMTools.PlanningPoker.Models;

public sealed class PlanningPokerVoteItem
{
    public Guid Id { get; set; }

    public Guid RoomId { get; set; }

    [JsonIgnore]
    public PlanningPokerRoom Room { get; set; } = null!;

    public string Title { get; private set; } = default!;

    public DateTimeOffset CreatedAt { get; private set; }

    public bool IsRevealed { get; private set; }

    [JsonIgnore]
    public ICollection<PlanningPokerVote> Votes { get; set; } = new List<PlanningPokerVote>();

    private PlanningPokerVoteItem() { }

    public static PlanningPokerVoteItem Create(string title, Guid roomId, Guid id)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new BusinessRuleException("Vote item title is required.");
        return new PlanningPokerVoteItem
        {
            Id = id,
            RoomId = roomId,
            Title = title.Trim(),
            CreatedAt = DateTimeOffset.UtcNow,
            IsRevealed = false,
        };
    }

    public void Reveal() => IsRevealed = true;

    public void Reset() => IsRevealed = false;

    public void Hide() => IsRevealed = false;

    public void EnsureVotingOpen()
    {
        if (IsRevealed)
            throw new BusinessRuleException("VotesAlreadyRevealed", "Votes for this item are already revealed.");
    }
}
