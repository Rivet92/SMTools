using System.Text.Json.Serialization;
using SMTools.Abstractions;

namespace SMTools.Retro.Models;

public sealed class RetroCard : IEntity, ISoftDeletable
{
    public Guid Id { get; set; }

    public Guid RoomId { get; set; }

    [JsonIgnore]
    public RetroRoom Room { get; set; } = null!;

    public Guid ColumnId { get; set; }

    [JsonIgnore]
    public RetroColumn Column { get; set; } = null!;

    public Guid? GroupId { get; set; }

    [JsonIgnore]
    public RetroCardGroup? Group { get; set; }

    public string Content { get; set; } = string.Empty;

    public Guid AuthorParticipantId { get; set; }

    [JsonIgnore]
    public RetroRoomParticipant Author { get; set; } = null!;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }

    [JsonIgnore]
    public ICollection<RetroVote> Votes { get; set; } = new List<RetroVote>();
}
