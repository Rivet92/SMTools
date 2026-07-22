using SMTools.Abstractions;
using System.Text.Json.Serialization;
using SMTools.Abstractions.ValueObjects;

namespace SMTools.PlanningPoker.Models;

public sealed class PlanningPokerRoom : IRoom
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public string? PasswordHash
    {
        get => RoomPassword?.Hash;
        set => RoomPassword = value is not null ? Password.FromHash(value) : null;
    }

    public Guid DeckId { get; set; }

    [JsonIgnore]
    public Password? RoomPassword { get; set; }

    [JsonIgnore]
    public PlanningPokerDeck Deck { get; set; } = null!;

    [JsonIgnore]
    public ICollection<PlanningPokerRoomParticipant> Participants { get; set; } = new List<PlanningPokerRoomParticipant>();

    [JsonIgnore]
    public ICollection<PlanningPokerVoteItem> VoteItems { get; set; } = new List<PlanningPokerVoteItem>();

    [JsonIgnore]
    public ICollection<PlanningPokerVote> Votes { get; set; } = new List<PlanningPokerVote>();

    [JsonIgnore]
    public bool HasPassword => RoomPassword is not null;

}
