using SMTools.Kanban.DTOs.Hubs;

namespace SMTools.Kanban.Services;

public interface IKanbanCardService
{
    Task<KanbanRoomStateDto> AddCardAsync(
        Guid roomId, Guid columnId, string title, string? description,
        Guid authorParticipantId, Guid? assignedParticipantId,
        string? repoUrl, string? repoBranch,
        double? initialEstimation, double? remaining,
        DateTimeOffset? dueAt, CancellationToken ct);

    Task<KanbanRoomStateDto> UpdateCardAsync(
        Guid roomId, Guid cardId, string title, string? description,
        Guid? assignedParticipantId,
        string? repoUrl, string? repoBranch,
        double? initialEstimation, double? remaining,
        DateTimeOffset? dueAt, Guid callerParticipantId, CancellationToken ct);

    Task<KanbanRoomStateDto> MoveCardAsync(
        Guid roomId, Guid cardId, Guid columnId,
        int targetDisplayOrder, Guid callerParticipantId, CancellationToken ct);

    Task<KanbanRoomStateDto> AssignCardAsync(
        Guid roomId, Guid cardId, Guid? assignedParticipantId,
        Guid callerParticipantId, CancellationToken ct);

    Task<KanbanRoomStateDto> DeleteCardAsync(
        Guid roomId, Guid cardId, Guid callerParticipantId, CancellationToken ct);
}
