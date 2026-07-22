using Microsoft.AspNetCore.SignalR;
using SMTools.Kanban.DTOs.Hubs;

namespace SMTools.Kanban.Hubs;

public sealed partial class KanbanHub
{
    public async Task<KanbanRoomStateDto> AddComment(Guid roomId, Guid cardId, string content)
    {
        var ct = Context.ConnectionAborted;
        var caller = await EnsureParticipant(roomId, ct);

        return await ExecuteAndBroadcastAsync(roomId, async (id, token) =>
            await _commentService.AddCommentAsync(id, cardId, content, caller.Id, token), ct);
    }

    public async Task<KanbanRoomStateDto> UpdateComment(Guid roomId, Guid cardId, Guid commentId, string content)
    {
        var ct = Context.ConnectionAborted;
        var caller = await EnsureParticipant(roomId, ct);

        return await ExecuteAndBroadcastAsync(roomId, async (id, token) =>
            await _commentService.UpdateCommentAsync(id, cardId, commentId, content, caller.Id, token), ct);
    }

    public async Task<KanbanRoomStateDto> DeleteComment(Guid roomId, Guid cardId, Guid commentId)
    {
        var ct = Context.ConnectionAborted;
        var caller = await EnsureParticipant(roomId, ct);

        return await ExecuteAndBroadcastAsync(roomId, async (id, token) =>
            await _commentService.DeleteCommentAsync(id, cardId, commentId, caller.Id, token), ct);
    }
}
