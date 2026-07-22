using SMTools.Abstractions;
using SMTools.Abstractions.Exceptions;
using SMTools.Kanban.Data;
using SMTools.Kanban.DTOs.Hubs;

using SMTools.Kanban.Models;

namespace SMTools.Kanban.Services;

public sealed class KanbanColumnService : IKanbanColumnService
{
    private readonly IKanbanRepository _repo;
    private readonly IStateBuilder<KanbanRoomStateDto> _stateBuilder;
    private readonly IUnitOfWork<KanbanDbContext> _uow;

    public KanbanColumnService(IKanbanRepository repo, IStateBuilder<KanbanRoomStateDto> stateBuilder, IUnitOfWork<KanbanDbContext> uow)
    {
        _repo = repo;
        _stateBuilder = stateBuilder;
        _uow = uow;
    }

    public async Task<KanbanRoomStateDto> AddColumnAsync(
        Guid roomId, string title, string? description,
        Guid callerParticipantId, CancellationToken ct)
    {
        var nextOrder = await _repo.GetNextColumnOrderAsync(roomId, ct);

        var column = new KanbanColumn
        {
            Id = Guid.NewGuid(),
            RoomId = roomId,
            Title = title.Trim(),
            Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim(),
            DisplayOrder = nextOrder + 1,
        };

        await _repo.AddColumnAsync(column, ct);
        await _uow.SaveChangesAsync(ct);

        return await _stateBuilder.BuildStateAsync(roomId, callerParticipantId, ct);
    }

    public async Task<KanbanRoomStateDto> UpdateColumnAsync(
        Guid roomId, Guid columnId, string title, string? description,
        Guid callerParticipantId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new BusinessRuleException("Title is required.");
        var column = await GetColumnOrThrow(roomId, columnId, ct);

        column.Title = title.Trim();
        column.Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        await _uow.SaveChangesAsync(ct);

        return await _stateBuilder.BuildStateAsync(roomId, callerParticipantId, ct);
    }

    public async Task<KanbanRoomStateDto> DeleteColumnAsync(
        Guid roomId, Guid columnId, Guid? targetColumnId,
        Guid callerParticipantId, CancellationToken ct)
    {
        var column = await GetColumnOrThrow(roomId, columnId, ct);

        if (targetColumnId.HasValue)
        {
            var targetColumn = await GetColumnOrThrow(roomId, targetColumnId.Value, ct);

            if (targetColumn.Id == column.Id)
                throw new BusinessRuleException("CannotMoveCardsToSameColumn", "Cannot move cards to the column being deleted.");

            var cardsToMove = await _repo.GetCardsByColumnAsync(columnId, ct);

            var nextOrder = await _repo.GetNextCardOrderAsync(targetColumnId.Value, ct);

            foreach (var card in cardsToMove)
            {
                card.MoveToColumn(targetColumnId.Value, ++nextOrder);
            }
        }

        await _repo.DeleteColumnAsync(columnId, ct);
        await _uow.SaveChangesAsync(ct);

        return await _stateBuilder.BuildStateAsync(roomId, callerParticipantId, ct);
    }

    public async Task<KanbanRoomStateDto> ReorderColumnsAsync(
        Guid roomId, Guid[] columnIds,
        Guid callerParticipantId, CancellationToken ct)
    {
        var columns = await _repo.GetAllColumnsAsync(roomId, ct);

        var columnIdSet = new HashSet<Guid>(columnIds);
        if (columns.Any(c => !columnIdSet.Contains(c.Id)))
            throw new BusinessRuleException("All existing columns must be included in the new order.");

        var orderMap = columnIds
            .Select((id, index) => (id, index))
            .ToDictionary(x => x.id, x => x.index + 1);

        foreach (var column in columns)
        {
            column.DisplayOrder = orderMap[column.Id];
        }

        await _uow.SaveChangesAsync(ct);

        return await _stateBuilder.BuildStateAsync(roomId, callerParticipantId, ct);
    }

    private async Task<KanbanColumn> GetColumnOrThrow(Guid roomId, Guid columnId, CancellationToken ct)
    {
        var column = await _repo.GetColumnAsync(columnId, roomId, ct);
        return column ?? throw new NotFoundException<KanbanColumn>(columnId);
    }

}
