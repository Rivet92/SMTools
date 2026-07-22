using Microsoft.AspNetCore.SignalR;
using SMTools.Kanban.DTOs.Hubs;

namespace SMTools.Kanban.Hubs;

public sealed partial class KanbanHub
{
    public async Task<KanbanRoomStateDto> AddColumn(Guid roomId, string title, string? description)
    {
        var ct = Context.ConnectionAborted;
        var caller = await EnsureOwnerOrAdmin(roomId, ct);

        return await ExecuteAndBroadcastAsync(roomId, async (id, token) =>
            await _columnService.AddColumnAsync(id, title, description, caller.Id, token), ct);
    }

    public async Task<KanbanRoomStateDto> UpdateColumn(Guid roomId, Guid columnId, string title, string? description)
    {
        var ct = Context.ConnectionAborted;
        var caller = await EnsureOwnerOrAdmin(roomId, ct);

        return await ExecuteAndBroadcastAsync(roomId, async (id, token) =>
            await _columnService.UpdateColumnAsync(id, columnId, title, description, caller.Id, token), ct);
    }

    public async Task<KanbanRoomStateDto> DeleteColumn(Guid roomId, Guid columnId, Guid? targetColumnId = null)
    {
        var ct = Context.ConnectionAborted;
        var caller = await EnsureOwnerOrAdmin(roomId, ct);

        return await ExecuteAndBroadcastAsync(roomId, async (id, token) =>
            await _columnService.DeleteColumnAsync(id, columnId, targetColumnId, caller.Id, token), ct);
    }

    public async Task<KanbanRoomStateDto> ReorderColumns(Guid roomId, Guid[] columnIds)
    {
        var ct = Context.ConnectionAborted;
        var caller = await EnsureOwnerOrAdmin(roomId, ct);

        return await ExecuteAndBroadcastAsync(roomId, async (id, token) =>
            await _columnService.ReorderColumnsAsync(id, columnIds, caller.Id, token), ct);
    }
}
