using System.Text.Json.Serialization;
using SMTools.Abstractions;

namespace SMTools.Kanban.Models;

public sealed class KanbanCardComment : IEntity, ISoftDeletable
{
    public Guid Id { get; set; }

    public Guid CardId { get; set; }

    [JsonIgnore]
    public KanbanCard Card { get; set; } = null!;

    public Guid AuthorParticipantId { get; set; }

    [JsonIgnore]
    public KanbanRoomParticipant AuthorParticipant { get; set; } = null!;

    public string Content { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }
}
