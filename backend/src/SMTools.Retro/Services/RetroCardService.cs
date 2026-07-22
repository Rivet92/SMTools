using SMTools.Abstractions;
using SMTools.Abstractions.Exceptions;

using SMTools.Retro.Data;
using SMTools.Retro.DTOs.Hubs;

using SMTools.Retro.Models;

namespace SMTools.Retro.Services;

public sealed class RetroCardService : IRetroCardService
{
    private readonly IRetroRepository _repo;
    private readonly IStateBuilder<RetroRoomStateDto> _stateBuilder;
    private readonly IUnitOfWork<RetroDbContext> _uow;

    public RetroCardService(IRetroRepository repo, IStateBuilder<RetroRoomStateDto> stateBuilder, IUnitOfWork<RetroDbContext> uow)
    {
        _repo = repo;
        _stateBuilder = stateBuilder;
        _uow = uow;
    }

    public async Task<RetroRoomStateDto> AddCardAsync(
        Guid roomId, Guid columnId, string content,
        Guid authorParticipantId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(content))
            throw new BusinessRuleException("Content is required.");
        var room = await _repo.GetRoomAsync(roomId, ct);
        if (room is null)
            throw new NotFoundException<RetroRoom>(roomId);

        if (room.Phase != RetroPhase.Gathering)
            throw new BusinessRuleException("CardNotInGatheringPhase", "Cards can only be added during the gathering phase.");

        var columnExists = await _repo.ColumnExistsAsync(columnId, room.TemplateId, ct);
        if (!columnExists)
            throw new NotFoundException<RetroColumn>(columnId);

        var card = new RetroCard
        {
            Id = Guid.NewGuid(),
            RoomId = roomId,
            ColumnId = columnId,
            Content = content.Trim(),
            AuthorParticipantId = authorParticipantId,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        await _repo.AddCardAsync(card, ct);
        await _uow.SaveChangesAsync(ct);

        return await _stateBuilder.BuildStateAsync(roomId, authorParticipantId, ct);
    }

    public async Task<RetroRoomStateDto> MoveCardToGroupAsync(
        Guid roomId, Guid cardId, Guid? groupId,
        Guid callerParticipantId, CancellationToken ct)
    {
        var room = await _repo.GetRoomAsync(roomId, ct);
        if (room is null)
            throw new NotFoundException<RetroRoom>(roomId);

        if (room.Phase != RetroPhase.Grouping)
            throw new BusinessRuleException("Cards can only be grouped during the grouping phase.");

        var card = await GetCardOrThrow(roomId, cardId, ct);
        await EnsureAuthorOrAdmin(callerParticipantId, card.AuthorParticipantId, roomId, ct);

        if (groupId is not null)
        {
            var groupExists = await _repo.GetGroupAsync(groupId.Value, roomId, ct);
            if (groupExists is null)
                throw new NotFoundException<RetroCardGroup>(groupId.Value);
        }

        await using var tx = await _uow.BeginTransactionAsync(ct);

        var previousGroupId = card.GroupId;
        card.GroupId = groupId;
        await _uow.SaveChangesAsync(ct);

        if (previousGroupId is not null && previousGroupId != groupId)
        {
            await DissolveGroupIfEmpty(roomId, previousGroupId.Value, ct);
            await _uow.SaveChangesAsync(ct);
        }

        await tx.CommitAsync(ct);

        return await _stateBuilder.BuildStateAsync(roomId, callerParticipantId, ct);
    }

    public async Task<RetroRoomStateDto> CreateGroupFromCardsAsync(
        Guid roomId, string title, Guid firstCardId, Guid secondCardId,
        Guid callerParticipantId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new BusinessRuleException("Title is required.");
        var room = await _repo.GetRoomAsync(roomId, ct);
        if (room is null)
            throw new NotFoundException<RetroRoom>(roomId);

        if (room.Phase != RetroPhase.Grouping)
            throw new BusinessRuleException("Groups can only be created during the grouping phase.");

        var firstCard = await GetCardOrThrow(roomId, firstCardId, ct);
        var secondCard = await GetCardOrThrow(roomId, secondCardId, ct);

        if (firstCard.Id == secondCard.Id)
            throw new BusinessRuleException("Cannot group a card with itself.");

        if (firstCard.GroupId == secondCard.GroupId && firstCard.GroupId is not null)
            throw new BusinessRuleException("Cards are already grouped together.");

        var group = new RetroCardGroup
        {
            Id = Guid.NewGuid(),
            RoomId = roomId,
            Title = title.Trim(),
            CreatedAt = DateTimeOffset.UtcNow,
        };

        var previousFirstGroupId = firstCard.GroupId;
        var previousSecondGroupId = secondCard.GroupId;

        await using var tx = await _uow.BeginTransactionAsync(ct);

        await _repo.AddGroupAsync(group, ct);
        await _uow.SaveChangesAsync(ct);

        firstCard.GroupId = group.Id;
        firstCard.CreatedAt = DateTimeOffset.UtcNow.AddTicks(-1);
        secondCard.GroupId = group.Id;
        secondCard.CreatedAt = DateTimeOffset.UtcNow;
        await _uow.SaveChangesAsync(ct);

        var previousGroupIds = new[] { previousFirstGroupId, previousSecondGroupId }
            .Where(id => id is not null)
            .Distinct()
            .ToList();

        foreach (var previousGroupId in previousGroupIds)
        {
            await DissolveGroupIfEmpty(roomId, previousGroupId!.Value, ct);
        }

        await _uow.SaveChangesAsync(ct);

        await tx.CommitAsync(ct);

        return await _stateBuilder.BuildStateAsync(roomId, callerParticipantId, ct);
    }

    public async Task<RetroRoomStateDto> DeleteCardAsync(
        Guid roomId, Guid cardId,
        Guid callerParticipantId, CancellationToken ct)
    {
        var card = await GetCardOrThrow(roomId, cardId, ct);
        await EnsureAuthorOrAdmin(callerParticipantId, card.AuthorParticipantId, roomId, ct);

        await _repo.DeleteVotesForCardAsync(cardId, ct);
        await _repo.DeleteCardAsync(cardId, ct);
        await _uow.SaveChangesAsync(ct);

        return await _stateBuilder.BuildStateAsync(roomId, callerParticipantId, ct);
    }

    private async Task<RetroCard> GetCardOrThrow(Guid roomId, Guid cardId, CancellationToken ct)
    {
        var card = await _repo.GetCardAsync(cardId, roomId, ct);
        return card ?? throw new NotFoundException<RetroCard>(cardId);
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

    private async Task DissolveGroupIfEmpty(Guid roomId, Guid groupId, CancellationToken ct)
    {
        var remainingCards = await _repo.GetCardsByGroupAsync(groupId, ct);

        if (remainingCards.Count <= 1)
        {
            foreach (var remainingCard in remainingCards)
                remainingCard.GroupId = null;

            var group = await _repo.GetGroupAsync(groupId, roomId, ct);
            if (group is not null)
                await _repo.DeleteGroupAsync(groupId, ct);
        }
    }

}
