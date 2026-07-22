using System.Text.Json.Serialization;
using SMTools.Abstractions;

namespace SMTools.Retro.Models;

public sealed class RetroVote : IEntity, ISoftDeletable
{
    public Guid Id { get; set; }

    public Guid RoomId { get; set; }

    [JsonIgnore]
    public RetroRoom Room { get; set; } = null!;

    public Guid CardId { get; set; }

    [JsonIgnore]
    public RetroCard Card { get; set; } = null!;

    public Guid ParticipantId { get; set; }

    [JsonIgnore]
    public RetroRoomParticipant Participant { get; set; } = null!;

    public int Points { get; set; } = 1;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }
}
