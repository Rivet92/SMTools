using Microsoft.AspNetCore.SignalR;
using SMTools.Retro.DTOs.Hubs;

namespace SMTools.Retro.Hubs;

public sealed partial class RetroHub
{
    public async Task<RetroRoomStateDto> AddVotePoint(Guid roomId, Guid cardId)
    {
        var ct = Context.ConnectionAborted;
        var participant = await EnsureParticipant(roomId, ct);

        return await ExecuteAndBroadcastAsync(roomId, async (id, token) =>
            await _voteService.AddVotePointAsync(id, cardId, participant.Id, token), ct);
    }

    public async Task<RetroRoomStateDto> RemoveVotePoint(Guid roomId, Guid cardId)
    {
        var ct = Context.ConnectionAborted;
        var participant = await EnsureParticipant(roomId, ct);

        return await ExecuteAndBroadcastAsync(roomId, async (id, token) =>
            await _voteService.RemoveVotePointAsync(id, cardId, participant.Id, token), ct);
    }
}
