using SMTools.Abstractions;
using System.Text.Json.Serialization;

namespace SMTools.PlanningPoker.Models;

public sealed class PlanningPokerRoomParticipant : IRoomParticipant
{
    public Guid Id { get; set; }

    public Guid RoomId { get; set; }

    [JsonIgnore]
    public PlanningPokerRoom Room { get; set; } = null!;

    public string ConnectionId { get; set; } = string.Empty;

    public string DisplayName { get; set; } = string.Empty;

    public Guid? UserId { get; set; }

    public bool IsOwner { get; set; }

    public bool IsAdmin { get; set; }

    public bool IsConnected { get; set; }

    public bool HasLeft { get; set; }

    public DateTimeOffset JoinedAt { get; set; }

    [JsonIgnore]
    public ICollection<PlanningPokerVote> Votes { get; set; } = new List<PlanningPokerVote>();
}
