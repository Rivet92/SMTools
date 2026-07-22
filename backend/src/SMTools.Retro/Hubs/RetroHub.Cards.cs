using Microsoft.AspNetCore.SignalR;
using SMTools.Retro.DTOs.Hubs;

namespace SMTools.Retro.Hubs;

public sealed partial class RetroHub
{
    public async Task<RetroRoomStateDto> AddCard(Guid roomId, Guid columnId, string content)
    {
        var ct = Context.ConnectionAborted;
        var participant = await EnsureParticipant(roomId, ct);

        return await ExecuteAndBroadcastAsync(roomId, async (id, token) =>
            await _cardService.AddCardAsync(id, columnId, content, participant.Id, token), ct);
    }

    public async Task<RetroRoomStateDto> MoveCardToGroup(Guid roomId, Guid cardId, Guid? groupId)
    {
        var ct = Context.ConnectionAborted;
        var caller = await EnsureParticipant(roomId, ct);

        return await ExecuteAndBroadcastAsync(roomId, async (id, token) =>
            await _cardService.MoveCardToGroupAsync(id, cardId, groupId, caller.Id, token), ct);
    }

    public async Task<RetroRoomStateDto> CreateGroupFromCards(Guid roomId, string title, Guid firstCardId, Guid secondCardId)
    {
        var ct = Context.ConnectionAborted;
        var caller = await EnsureOwnerOrAdmin(roomId, ct);

        return await ExecuteAndBroadcastAsync(roomId, async (id, token) =>
            await _cardService.CreateGroupFromCardsAsync(id, title, firstCardId, secondCardId, caller.Id, token), ct);
    }

    public async Task<RetroRoomStateDto> DeleteCard(Guid roomId, Guid cardId)
    {
        var ct = Context.ConnectionAborted;
        var caller = await EnsureParticipant(roomId, ct);

        return await ExecuteAndBroadcastAsync(roomId, async (id, token) =>
            await _cardService.DeleteCardAsync(id, cardId, caller.Id, token), ct);
    }
}
