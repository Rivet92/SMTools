using SMTools.Kanban.DTOs.Hubs;

namespace SMTools.Kanban.Services;

public interface IKanbanCommentService
{
    Task<KanbanRoomStateDto> AddCommentAsync(
        Guid roomId, Guid cardId, string content,
        Guid authorParticipantId, CancellationToken ct);

    Task<KanbanRoomStateDto> UpdateCommentAsync(
        Guid roomId, Guid cardId, Guid commentId, string content,
        Guid callerParticipantId, CancellationToken ct);

    Task<KanbanRoomStateDto> DeleteCommentAsync(
        Guid roomId, Guid cardId, Guid commentId,
        Guid callerParticipantId, CancellationToken ct);
}
