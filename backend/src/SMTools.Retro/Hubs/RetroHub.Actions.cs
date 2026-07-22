using Microsoft.AspNetCore.SignalR;
using SMTools.Retro.DTOs.Hubs;

namespace SMTools.Retro.Hubs;

public sealed partial class RetroHub
{
    public async Task<RetroRoomStateDto> AddActionItem(Guid roomId, string content, Guid? assigneeParticipantId)
    {
        var ct = Context.ConnectionAborted;
        var caller = await EnsureParticipant(roomId, ct);

        return await ExecuteAndBroadcastAsync(roomId, async (id, token) =>
            await _actionItemService.AddActionItemAsync(id, content, assigneeParticipantId, caller.Id, token), ct);
    }

    public async Task<RetroRoomStateDto> AssignActionItem(Guid roomId, Guid actionItemId, Guid? assigneeParticipantId)
    {
        var ct = Context.ConnectionAborted;
        var caller = await EnsureParticipant(roomId, ct);

        return await ExecuteAndBroadcastAsync(roomId, async (id, token) =>
            await _actionItemService.AssignActionItemAsync(id, actionItemId, assigneeParticipantId, caller.Id, token), ct);
    }

    public async Task<RetroRoomStateDto> DeleteActionItem(Guid roomId, Guid actionItemId)
    {
        var ct = Context.ConnectionAborted;
        var caller = await EnsureOwnerOrAdmin(roomId, ct);

        return await ExecuteAndBroadcastAsync(roomId, async (id, token) =>
            await _actionItemService.DeleteActionItemAsync(id, actionItemId, caller.Id, token), ct);
    }
}
