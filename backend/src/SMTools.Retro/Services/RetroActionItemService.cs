using SMTools.Abstractions;
using SMTools.Abstractions.Exceptions;
using SMTools.Retro.Data;
using SMTools.Retro.DTOs.Hubs;

using SMTools.Retro.Models;

namespace SMTools.Retro.Services;

public sealed class RetroActionItemService : IRetroActionItemService
{
    private readonly IRetroRepository _repo;
    private readonly IStateBuilder<RetroRoomStateDto> _stateBuilder;
    private readonly IUnitOfWork<RetroDbContext> _uow;

    public RetroActionItemService(IRetroRepository repo, IStateBuilder<RetroRoomStateDto> stateBuilder, IUnitOfWork<RetroDbContext> uow)
    {
        _repo = repo;
        _stateBuilder = stateBuilder;
        _uow = uow;
    }

    public async Task<RetroRoomStateDto> AddActionItemAsync(
        Guid roomId, string content, Guid? assigneeParticipantId,
        Guid callerParticipantId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(content))
            throw new BusinessRuleException("Content is required.");
        var room = await _repo.GetRoomAsync(roomId, ct);
        if (room is null)
            throw new NotFoundException<RetroRoom>(roomId);

        if (room.Phase != RetroPhase.Actions)
            throw new BusinessRuleException("Action items can only be added during the action items phase.");

        if (assigneeParticipantId is not null)
        {
            var participants = await _repo.GetParticipantsAsync(roomId, ct);
            var assigneeExists = participants.Any(p => p.Id == assigneeParticipantId);
            if (!assigneeExists)
                throw new NotFoundException<RetroRoomParticipant>(assigneeParticipantId.Value);
        }

        var actionItem = new RetroActionItem
        {
            Id = Guid.NewGuid(),
            RoomId = roomId,
            Content = content.Trim(),
            AssigneeParticipantId = assigneeParticipantId,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        await _repo.AddActionItemAsync(actionItem, ct);
        await _uow.SaveChangesAsync(ct);

        return await _stateBuilder.BuildStateAsync(roomId, callerParticipantId, ct);
    }

    public async Task<RetroRoomStateDto> AssignActionItemAsync(
        Guid roomId, Guid actionItemId, Guid? assigneeParticipantId,
        Guid callerParticipantId, CancellationToken ct)
    {
        var actionItem = await _repo.GetActionItemAsync(actionItemId, roomId, ct);
        if (actionItem is null)
            throw new NotFoundException<RetroActionItem>(actionItemId);

        if (assigneeParticipantId is not null)
        {
            var participants = await _repo.GetParticipantsAsync(roomId, ct);
            var assigneeExists = participants.Any(p => p.Id == assigneeParticipantId);
            if (!assigneeExists)
                throw new NotFoundException<RetroRoomParticipant>(assigneeParticipantId.Value);
        }

        actionItem.AssigneeParticipantId = assigneeParticipantId;
        await _uow.SaveChangesAsync(ct);

        return await _stateBuilder.BuildStateAsync(roomId, callerParticipantId, ct);
    }

    public async Task<RetroRoomStateDto> DeleteActionItemAsync(
        Guid roomId, Guid actionItemId,
        Guid callerParticipantId, CancellationToken ct)
    {
        var actionItem = await _repo.GetActionItemAsync(actionItemId, roomId, ct);
        if (actionItem is null)
            throw new NotFoundException<RetroActionItem>(actionItemId);

        await _repo.DeleteActionItemAsync(actionItemId, ct);
        await _uow.SaveChangesAsync(ct);

        return await _stateBuilder.BuildStateAsync(roomId, callerParticipantId, ct);
    }
}
