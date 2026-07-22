using SMTools.Kanban.DTOs.Hubs;

namespace SMTools.Kanban.Services;

public interface IKanbanColumnService
{
    Task<KanbanRoomStateDto> AddColumnAsync(
        Guid roomId, string title, string? description,
        Guid callerParticipantId, CancellationToken ct);

    Task<KanbanRoomStateDto> UpdateColumnAsync(
        Guid roomId, Guid columnId, string title, string? description,
        Guid callerParticipantId, CancellationToken ct);

    Task<KanbanRoomStateDto> DeleteColumnAsync(
        Guid roomId, Guid columnId, Guid? targetColumnId,
        Guid callerParticipantId, CancellationToken ct);

    Task<KanbanRoomStateDto> ReorderColumnsAsync(
        Guid roomId, Guid[] columnIds,
        Guid callerParticipantId, CancellationToken ct);
}
