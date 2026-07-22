using SMTools.Abstractions;
using System.Text.Json.Serialization;

namespace SMTools.Retro.Models;

public sealed class RetroRoomParticipant : IRoomParticipant
{
    public Guid Id { get; set; }

    public Guid RoomId { get; set; }

    [JsonIgnore]
    public RetroRoom Room { get; set; } = null!;

    public string ConnectionId { get; set; } = string.Empty;

    public string DisplayName { get; set; } = string.Empty;

    public Guid? UserId { get; set; }

    public bool IsOwner { get; set; }

    public bool IsAdmin { get; set; }

    public bool IsConnected { get; set; }

    public bool HasLeft { get; set; }

    public DateTimeOffset JoinedAt { get; set; }

    [JsonIgnore]
    public ICollection<RetroVote> Votes { get; set; } = new List<RetroVote>();

    [JsonIgnore]
    public ICollection<RetroCard> AuthoredCards { get; set; } = new List<RetroCard>();

    [JsonIgnore]
    public ICollection<RetroActionItem> AssignedActionItems { get; set; } = new List<RetroActionItem>();
}
