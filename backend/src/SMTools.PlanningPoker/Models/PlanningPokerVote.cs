using System.Text.Json.Serialization;
using SMTools.Abstractions;

namespace SMTools.PlanningPoker.Models;

public sealed class PlanningPokerVote : ISoftDeletable
{
    public Guid Id { get; set; }

    public Guid RoomId { get; set; }

    [JsonIgnore]
    public PlanningPokerRoom Room { get; set; } = null!;

    public Guid VoteItemId { get; set; }

    [JsonIgnore]
    public PlanningPokerVoteItem VoteItem { get; set; } = null!;

    public Guid ParticipantId { get; set; }

    [JsonIgnore]
    public PlanningPokerRoomParticipant Participant { get; set; } = null!;

    public string Value { get; private set; } = default!;

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset? DeletedAt { get; set; }

    private PlanningPokerVote() { }

    public static PlanningPokerVote Create(Guid participantId, string value, DateTimeOffset createdAt)
    {
        return new PlanningPokerVote
        {
            Id = Guid.NewGuid(),
            ParticipantId = participantId,
            Value = value,
            CreatedAt = createdAt,
        };
    }

    internal void UpdateVote(string value)
    {
        Value = value;
        CreatedAt = DateTimeOffset.UtcNow;
        DeletedAt = null;
    }
}
