using SMTools.Abstractions;
using SMTools.Abstractions.Dtos;
using SMTools.Kanban.DTOs.Apis;
using SMTools.Kanban.DTOs.Hubs;
using SMTools.Kanban.Models;

namespace SMTools.Kanban.Data;

public interface IKanbanRepository : IRoomRepository<KanbanRoom, KanbanRoomParticipant>
{
    Task<KanbanRoom?> GetFullRoomStateAsync(Guid roomId, CancellationToken ct);

    Task<KanbanRoomParticipant?> GetParticipantAsync(Guid participantId, Guid roomId, CancellationToken ct);
    Task<bool> ParticipantExistsAsync(Guid roomId, Guid participantId, CancellationToken ct);

    Task<KanbanColumn?> GetColumnAsync(Guid columnId, Guid roomId, CancellationToken ct);
    Task AddColumnAsync(KanbanColumn column, CancellationToken ct);
    Task DeleteColumnAsync(Guid columnId, CancellationToken ct);
    Task<int> GetNextColumnOrderAsync(Guid roomId, CancellationToken ct);
    Task<List<KanbanColumn>> GetAllColumnsAsync(Guid roomId, CancellationToken ct);

    Task<KanbanCard?> GetCardAsync(Guid cardId, Guid roomId, CancellationToken ct);
    Task AddCardAsync(KanbanCard card, CancellationToken ct);
    Task DeleteCardAsync(Guid cardId);
    Task<List<KanbanCard>> GetCardsByColumnAsync(Guid columnId, CancellationToken ct);
    Task<int> GetNextCardOrderAsync(Guid columnId, CancellationToken ct);

    Task<KanbanCardComment?> GetCommentAsync(Guid cardId, Guid commentId, CancellationToken ct);
    Task AddCommentAsync(KanbanCardComment comment, CancellationToken ct);
    Task DeleteCommentAsync(KanbanCardComment comment);
}
