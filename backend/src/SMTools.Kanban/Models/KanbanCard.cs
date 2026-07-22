using System.Text.Json.Serialization;
using SMTools.Abstractions;

namespace SMTools.Kanban.Models;

public sealed class KanbanCard : IEntity, ISoftDeletable
{
    public Guid Id { get; set; }

    public Guid RoomId { get; set; }

    [JsonIgnore]
    public KanbanRoom Room { get; set; } = null!;

    public Guid ColumnId { get; private set; }

    [JsonIgnore]
    public KanbanColumn Column { get; set; } = null!;

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public Guid AuthorParticipantId { get; set; }

    [JsonIgnore]
    public KanbanRoomParticipant AuthorParticipant { get; set; } = null!;

    public Guid? AssignedParticipantId { get; private set; }

    [JsonIgnore]
    public KanbanRoomParticipant? Assignee { get; set; }

    public string? RepoUrl { get; set; }

    public string? RepoBranch { get; set; }

    public double? InitialEstimation { get; set; }

    public double? Remaining { get; set; }

    public DateTimeOffset? DueAt { get; set; }

    public int DisplayOrder { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }

    [JsonIgnore]
    public ICollection<KanbanCardComment> Comments { get; set; } = [];

    public void MoveToColumn(Guid columnId, int displayOrder)
    {
        ColumnId = columnId;
        DisplayOrder = displayOrder;
    }

    public void Assign(Guid? participantId)
    {
        AssignedParticipantId = participantId;
    }
}
