using Microsoft.EntityFrameworkCore;
using SMTools.Abstractions.Data;
using SMTools.Abstractions.Dtos;

namespace SMTools.PlanningPoker.Data;

public sealed class PlanningPokerDataHandler : IModuleDataHandler
{
    public string ModuleName => "planningpoker";

    public async Task<List<Guid>> GetOwnedRoomIdsAsync(DbContext db, Guid userId, CancellationToken ct)
    {
        var ppDb = (PlanningPokerDbContext)db;
        return await ppDb.PlanningPokerRoomParticipants
            .Where(p => p.UserId == userId && p.IsOwner)
            .Select(p => p.RoomId)
            .ToListAsync(ct);
    }

    public async Task DeleteOwnedRoomDataAsync(DbContext db, List<Guid> roomIds, CancellationToken ct)
    {
        var ppDb = (PlanningPokerDbContext)db;
        await ppDb.PlanningPokerVotes
            .Where(v => roomIds.Contains(v.RoomId))
            .ExecuteDeleteAsync(ct);
        await ppDb.PlanningPokerVoteItems
            .Where(i => roomIds.Contains(i.RoomId))
            .ExecuteDeleteAsync(ct);
        await ppDb.PlanningPokerRoomParticipants
            .Where(p => roomIds.Contains(p.RoomId))
            .ExecuteDeleteAsync(ct);
        await ppDb.PlanningPokerRooms
            .Where(r => roomIds.Contains(r.Id))
            .ExecuteDeleteAsync(ct);
    }

    public async Task DeleteMembershipsAsync(DbContext db, Guid userId, CancellationToken ct)
    {
        var ppDb = (PlanningPokerDbContext)db;
        await ppDb.PlanningPokerRoomParticipants
            .Where(p => p.UserId == userId && !p.IsOwner)
            .ExecuteDeleteAsync(ct);
    }

    public async Task<List<RoomMembershipDto>> GetMembershipsAsync(DbContext db, Guid userId, CancellationToken ct)
    {
        var ppDb = (PlanningPokerDbContext)db;
        return await ppDb.PlanningPokerRoomParticipants
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .Join(ppDb.PlanningPokerRooms,
                p => p.RoomId, r => r.Id,
                (p, r) => new RoomMembershipDto(
                    "planningpoker", r.Id, r.Title, p.IsOwner, p.IsAdmin,
                    null, null, p.JoinedAt
                ))
            .ToListAsync(ct);
    }

    public Task<List<object>> GetExportDataAsync(DbContext db, List<Guid> roomIds, Guid userId, CancellationToken ct)
    {
        return Task.FromResult(new List<object>());
    }
}
