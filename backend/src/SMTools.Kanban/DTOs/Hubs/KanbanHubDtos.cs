using SMTools.Abstractions.Dtos;
using SMTools.Abstractions.Hubs;

namespace SMTools.Kanban.DTOs.Hubs;

public sealed record KanbanColumnDto(Guid Id, string Title, string? Description, int DisplayOrder);

public sealed record KanbanCardCommentDto(
    Guid Id,
    Guid CardId,
    Guid AuthorParticipantId,
    string Content,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt
);

public sealed record KanbanCardDto(
    Guid Id,
    Guid ColumnId,
    string Title,
    string? Description,
    Guid AuthorParticipantId,
    Guid? AssignedParticipantId,
    int DisplayOrder,
    DateTimeOffset CreatedAt,
    string? RepoUrl,
    string? RepoBranch,
    double? InitialEstimation,
    double? Remaining,
    DateTimeOffset? DueAt,
    List<KanbanCardCommentDto> Comments
);

public sealed record KanbanRoomStateDto(
    Guid Id,
    string Title,
    DateTimeOffset CreatedAt,
    List<ParticipantDto> Participants,
    List<KanbanColumnDto> Columns,
    List<KanbanCardDto> Cards,
    Guid OwnParticipantId,
    bool HasPassword
) : IVersionedState
{
    public int Version { get; set; }
}
