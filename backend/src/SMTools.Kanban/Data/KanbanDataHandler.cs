using Microsoft.EntityFrameworkCore;
using SMTools.Abstractions.Data;
using SMTools.Abstractions.Dtos;

namespace SMTools.Kanban.Data;

public sealed class KanbanDataHandler : IModuleDataHandler
{
    public string ModuleName => "kanban";

    public async Task<List<Guid>> GetOwnedRoomIdsAsync(DbContext db, Guid userId, CancellationToken ct)
    {
        var kanbanDb = (KanbanDbContext)db;
        return await kanbanDb.KanbanRoomParticipants
            .Where(p => p.UserId == userId && p.IsOwner)
            .Select(p => p.RoomId)
            .ToListAsync(ct);
    }

    public async Task DeleteOwnedRoomDataAsync(DbContext db, List<Guid> roomIds, CancellationToken ct)
    {
        var kanbanDb = (KanbanDbContext)db;
        await kanbanDb.KanbanCards
            .Where(c => roomIds.Contains(c.RoomId))
            .ExecuteDeleteAsync(ct);
        await kanbanDb.KanbanColumns
            .Where(c => roomIds.Contains(c.RoomId))
            .ExecuteDeleteAsync(ct);
        await kanbanDb.KanbanRoomParticipants
            .Where(p => roomIds.Contains(p.RoomId))
            .ExecuteDeleteAsync(ct);
        await kanbanDb.KanbanRooms
            .Where(r => roomIds.Contains(r.Id))
            .ExecuteDeleteAsync(ct);
    }

    public async Task DeleteMembershipsAsync(DbContext db, Guid userId, CancellationToken ct)
    {
        var kanbanDb = (KanbanDbContext)db;
        await kanbanDb.KanbanRoomParticipants
            .Where(p => p.UserId == userId && !p.IsOwner)
            .ExecuteDeleteAsync(ct);
    }

    public async Task<List<RoomMembershipDto>> GetMembershipsAsync(DbContext db, Guid userId, CancellationToken ct)
    {
        var kanbanDb = (KanbanDbContext)db;
        return await kanbanDb.KanbanRoomParticipants
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .Join(kanbanDb.KanbanRooms,
                p => p.RoomId, r => r.Id,
                (p, r) => new RoomMembershipDto(
                    "kanban", r.Id, r.Title, p.IsOwner, p.IsAdmin,
                    null, null, p.JoinedAt
                ))
            .ToListAsync(ct);
    }

    public Task<List<object>> GetExportDataAsync(DbContext db, List<Guid> roomIds, Guid userId, CancellationToken ct)
    {
        return Task.FromResult(new List<object>());
    }
}
