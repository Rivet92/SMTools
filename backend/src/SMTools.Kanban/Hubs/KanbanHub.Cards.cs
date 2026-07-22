using Microsoft.AspNetCore.SignalR;
using SMTools.Kanban.DTOs.Hubs;

namespace SMTools.Kanban.Hubs;

public sealed partial class KanbanHub
{
    public async Task<KanbanRoomStateDto> AddCard(
        Guid roomId, Guid columnId, string title, string? description,
        string? repoUrl = null, string? repoBranch = null,
        double? initialEstimation = null, double? remaining = null,
        DateTimeOffset? dueAt = null, Guid? assignedParticipantId = null)
    {
        var ct = Context.ConnectionAborted;
        var participant = await EnsureParticipant(roomId, ct);

        return await ExecuteAndBroadcastAsync(roomId, async (id, token) =>
            await _cardService.AddCardAsync(
                id, columnId, title, description,
                participant.Id, assignedParticipantId,
                repoUrl, repoBranch, initialEstimation, remaining, dueAt, token), ct);
    }

    public async Task<KanbanRoomStateDto> UpdateCard(
        Guid roomId, Guid cardId, string title, string? description,
        string? repoUrl = null, string? repoBranch = null,
        double? initialEstimation = null, double? remaining = null,
        DateTimeOffset? dueAt = null, Guid? assignedParticipantId = null)
    {
        var ct = Context.ConnectionAborted;
        var caller = await EnsureParticipant(roomId, ct);

        return await ExecuteAndBroadcastAsync(roomId, async (id, token) =>
            await _cardService.UpdateCardAsync(
                id, cardId, title, description,
                assignedParticipantId,
                repoUrl, repoBranch, initialEstimation, remaining, dueAt,
                caller.Id, token), ct);
    }

    public async Task<KanbanRoomStateDto> MoveCard(Guid roomId, Guid cardId, Guid columnId, int targetDisplayOrder)
    {
        var ct = Context.ConnectionAborted;
        var participant = await EnsureParticipant(roomId, ct);

        return await ExecuteAndBroadcastAsync(roomId, async (id, token) =>
            await _cardService.MoveCardAsync(id, cardId, columnId, targetDisplayOrder, participant.Id, token), ct);
    }

    public async Task<KanbanRoomStateDto> AssignCard(Guid roomId, Guid cardId, Guid? assignedParticipantId)
    {
        var ct = Context.ConnectionAborted;
        var caller = await EnsureParticipant(roomId, ct);

        return await ExecuteAndBroadcastAsync(roomId, async (id, token) =>
            await _cardService.AssignCardAsync(id, cardId, assignedParticipantId, caller.Id, token), ct);
    }

    public async Task<KanbanRoomStateDto> DeleteCard(Guid roomId, Guid cardId)
    {
        var ct = Context.ConnectionAborted;
        var caller = await EnsureParticipant(roomId, ct);

        return await ExecuteAndBroadcastAsync(roomId, async (id, token) =>
            await _cardService.DeleteCardAsync(id, cardId, caller.Id, token), ct);
    }
}
