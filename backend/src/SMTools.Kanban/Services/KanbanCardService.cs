using SMTools.Abstractions;
using SMTools.Abstractions.Exceptions;
using SMTools.Kanban.Data;
using SMTools.Kanban.DTOs.Hubs;

using SMTools.Kanban.Models;

namespace SMTools.Kanban.Services;

public sealed class KanbanCardService : IKanbanCardService
{
    private readonly IKanbanRepository _repo;
    private readonly IStateBuilder<KanbanRoomStateDto> _stateBuilder;
    private readonly IUnitOfWork<KanbanDbContext> _uow;

    public KanbanCardService(IKanbanRepository repo, IStateBuilder<KanbanRoomStateDto> stateBuilder, IUnitOfWork<KanbanDbContext> uow)
    {
        _repo = repo;
        _stateBuilder = stateBuilder;
        _uow = uow;
    }

    public async Task<KanbanRoomStateDto> AddCardAsync(
        Guid roomId, Guid columnId, string title, string? description,
        Guid authorParticipantId, Guid? assignedParticipantId,
        string? repoUrl, string? repoBranch,
        double? initialEstimation, double? remaining,
        DateTimeOffset? dueAt, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new BusinessRuleException("Title is required.");

        var column = await _repo.GetColumnAsync(columnId, roomId, ct);
        if (column is null)
            throw new NotFoundException<KanbanColumn>(columnId);

        if (assignedParticipantId.HasValue)
        {
            var exists = await _repo.ParticipantExistsAsync(roomId, assignedParticipantId.Value, ct);
            if (!exists)
                throw new NotFoundException<KanbanRoomParticipant>(assignedParticipantId.Value);
        }

        var nextOrder = await _repo.GetNextCardOrderAsync(columnId, ct);

        var card = new KanbanCard
        {
            Id = Guid.NewGuid(),
            RoomId = roomId,
            Title = title.Trim(),
            Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim(),
            AuthorParticipantId = authorParticipantId,
            CreatedAt = DateTimeOffset.UtcNow,
            RepoUrl = string.IsNullOrWhiteSpace(repoUrl) ? null : repoUrl.Trim(),
            RepoBranch = string.IsNullOrWhiteSpace(repoBranch) ? null : repoBranch.Trim(),
            InitialEstimation = initialEstimation,
            Remaining = remaining,
            DueAt = dueAt,
        };

        card.MoveToColumn(columnId, nextOrder + 1);
        card.Assign(assignedParticipantId);

        await _repo.AddCardAsync(card, ct);
        await _uow.SaveChangesAsync(ct);

        return await _stateBuilder.BuildStateAsync(roomId, authorParticipantId, ct);
    }

    public async Task<KanbanRoomStateDto> UpdateCardAsync(
        Guid roomId, Guid cardId, string title, string? description,
        Guid? assignedParticipantId,
        string? repoUrl, string? repoBranch,
        double? initialEstimation, double? remaining,
        DateTimeOffset? dueAt, Guid callerParticipantId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new BusinessRuleException("Title is required.");

        var card = await GetCardOrThrow(roomId, cardId, ct);
        await EnsureAuthorOrAdmin(callerParticipantId, card.AuthorParticipantId, roomId, ct);

        if (assignedParticipantId.HasValue)
        {
            var exists = await _repo.ParticipantExistsAsync(roomId, assignedParticipantId.Value, ct);
            if (!exists)
                throw new NotFoundException<KanbanRoomParticipant>(assignedParticipantId.Value);
        }

        card.Title = title.Trim();
        card.Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        card.RepoUrl = string.IsNullOrWhiteSpace(repoUrl) ? null : repoUrl.Trim();
        card.RepoBranch = string.IsNullOrWhiteSpace(repoBranch) ? null : repoBranch.Trim();
        card.InitialEstimation = initialEstimation;
        card.Remaining = remaining;
        card.DueAt = dueAt;
        card.Assign(assignedParticipantId);
        await _uow.SaveChangesAsync(ct);

        return await _stateBuilder.BuildStateAsync(roomId, callerParticipantId, ct);
    }

    public async Task<KanbanRoomStateDto> MoveCardAsync(
        Guid roomId, Guid cardId, Guid columnId, int targetDisplayOrder,
        Guid callerParticipantId, CancellationToken ct)
    {
        // Any participant can move cards — collaborative kanban design.
        var card = await GetCardOrThrow(roomId, cardId, ct);

        var column = await _repo.GetColumnAsync(columnId, roomId, ct);
        if (column is null)
            throw new NotFoundException<KanbanColumn>(columnId);

        var sourceColumnId = card.ColumnId;

        var targetCards = (await _repo.GetCardsByColumnAsync(columnId, ct))
            .Where(c => c.Id != card.Id)
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Id)
            .ToList();

        var position = Math.Max(1, Math.Min(targetDisplayOrder, targetCards.Count + 1));

        card.MoveToColumn(columnId, position);
        for (var i = 0; i < targetCards.Count; i++)
        {
            targetCards[i].DisplayOrder = i + 1 < position ? i + 1 : i + 2;
        }

        if (sourceColumnId != columnId)
        {
            var sourceCards = (await _repo.GetCardsByColumnAsync(sourceColumnId, ct))
                .OrderBy(c => c.DisplayOrder)
                .ThenBy(c => c.Id)
                .ToList();

            for (var i = 0; i < sourceCards.Count; i++)
            {
                sourceCards[i].DisplayOrder = i + 1;
            }
        }

        await _uow.SaveChangesAsync(ct);

        return await _stateBuilder.BuildStateAsync(roomId, callerParticipantId, ct);
    }

    public async Task<KanbanRoomStateDto> AssignCardAsync(
        Guid roomId, Guid cardId, Guid? assignedParticipantId,
        Guid callerParticipantId, CancellationToken ct)
    {
        // Any participant can assign cards — collaborative kanban design.
        var card = await GetCardOrThrow(roomId, cardId, ct);

        if (assignedParticipantId.HasValue)
        {
            var exists = await _repo.ParticipantExistsAsync(roomId, assignedParticipantId.Value, ct);
            if (!exists)
                throw new NotFoundException<KanbanRoomParticipant>(assignedParticipantId.Value);
        }

        card.Assign(assignedParticipantId);
        await _uow.SaveChangesAsync(ct);

        return await _stateBuilder.BuildStateAsync(roomId, callerParticipantId, ct);
    }

    public async Task<KanbanRoomStateDto> DeleteCardAsync(
        Guid roomId, Guid cardId, Guid callerParticipantId, CancellationToken ct)
    {
        var card = await GetCardOrThrow(roomId, cardId, ct);
        await EnsureAuthorOrAdmin(callerParticipantId, card.AuthorParticipantId, roomId, ct);

        await _repo.DeleteCardAsync(cardId);
        await _uow.SaveChangesAsync(ct);

        return await _stateBuilder.BuildStateAsync(roomId, callerParticipantId, ct);
    }

    private async Task<KanbanCard> GetCardOrThrow(Guid roomId, Guid cardId, CancellationToken ct)
    {
        var card = await _repo.GetCardAsync(cardId, roomId, ct);
        return card ?? throw new NotFoundException<KanbanCard>(cardId);
    }

    private async Task EnsureAuthorOrAdmin(
        Guid callerParticipantId, Guid authorParticipantId, Guid roomId, CancellationToken ct)
    {
        if (callerParticipantId == authorParticipantId)
            return;

        var caller = await _repo.GetParticipantAsync(callerParticipantId, roomId, ct);
        if (caller is null || (!caller.IsOwner && !caller.IsAdmin))
            throw new ForbiddenException("Only the room owner, an admin, or the card author can perform this action.");
    }

}
