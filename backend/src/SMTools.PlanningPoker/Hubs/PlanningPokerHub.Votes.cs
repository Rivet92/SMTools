using Microsoft.AspNetCore.SignalR;
using SMTools.PlanningPoker.DTOs.Hubs;

namespace SMTools.PlanningPoker.Hubs;

public sealed partial class PlanningPokerHub
{
    public async Task<RoomStateDto> AddVoteItem(Guid roomId, string title)
    {
        var ct = Context.ConnectionAborted;
        var participant = await EnsureOwnerOrAdmin(roomId, ct);

        return await ExecuteAndBroadcastAsync(roomId, async (id, token) =>
        {
            return await _voteItemService.AddVoteItemAsync(id, title, participant.Id, token);
        }, ct);
    }

    public async Task<RoomStateDto> Vote(Guid roomId, Guid voteItemId, string value)
    {
        var ct = Context.ConnectionAborted;
        var participant = await EnsureParticipant(roomId, ct);

        return await ExecuteAndBroadcastAsync(roomId, async (id, token) =>
            await _voteItemService.VoteAsync(id, voteItemId, value, participant.Id, token), ct);
    }

    public async Task<RoomStateDto> RevealVotes(Guid roomId, Guid voteItemId)
    {
        var ct = Context.ConnectionAborted;
        var caller = await EnsureOwnerOrAdmin(roomId, ct);

        return await ExecuteAndBroadcastAsync(roomId, async (id, token) =>
            await _voteItemService.RevealVotesAsync(id, voteItemId, caller.Id, token), ct);
    }

    public async Task<RoomStateDto> ResetVotes(Guid roomId, Guid voteItemId)
    {
        var ct = Context.ConnectionAborted;
        var caller = await EnsureOwnerOrAdmin(roomId, ct);

        return await ExecuteAndBroadcastAsync(roomId, async (id, token) =>
            await _voteItemService.ResetVotesAsync(id, voteItemId, caller.Id, token), ct);
    }

    public async Task<RoomStateDto> HideVotes(Guid roomId, Guid voteItemId)
    {
        var ct = Context.ConnectionAborted;
        var caller = await EnsureOwnerOrAdmin(roomId, ct);

        return await ExecuteAndBroadcastAsync(roomId, async (id, token) =>
            await _voteItemService.HideVotesAsync(id, voteItemId, caller.Id, token), ct);
    }

    public async Task FocusVoteItem(Guid roomId, Guid voteItemId)
    {
        var ct = Context.ConnectionAborted;
        await EnsureOwnerOrAdmin(roomId, ct);

        var version = NextVersion(roomId);
        await Clients.Group(roomId.ToString()).SendAsync(
            "FocusVoteItem",
            new FocusVoteItemPayload(voteItemId, version),
            ct);
    }

    public async Task<RoomStateDto> DeleteVoteItem(Guid roomId, Guid voteItemId)
    {
        var ct = Context.ConnectionAborted;
        var caller = await EnsureOwnerOrAdmin(roomId, ct);

        return await ExecuteAndBroadcastAsync(roomId, async (id, token) =>
            await _voteItemService.DeleteVoteItemAsync(id, voteItemId, caller.Id, token), ct);
    }
}
