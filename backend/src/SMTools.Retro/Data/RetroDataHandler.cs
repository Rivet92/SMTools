using Microsoft.EntityFrameworkCore;
using SMTools.Abstractions.Data;
using SMTools.Abstractions.Dtos;

namespace SMTools.Retro.Data;

public sealed class RetroDataHandler : IModuleDataHandler
{
    public string ModuleName => "retro";

    public async Task<List<Guid>> GetOwnedRoomIdsAsync(DbContext db, Guid userId, CancellationToken ct)
    {
        var retroDb = (RetroDbContext)db;
        return await retroDb.RetroRoomParticipants
            .Where(p => p.UserId == userId && p.IsOwner)
            .Select(p => p.RoomId)
            .ToListAsync(ct);
    }

    public async Task DeleteOwnedRoomDataAsync(DbContext db, List<Guid> roomIds, CancellationToken ct)
    {
        var retroDb = (RetroDbContext)db;
        await retroDb.RetroActionItems
            .Where(a => roomIds.Contains(a.RoomId))
            .ExecuteDeleteAsync(ct);
        await retroDb.RetroVotes
            .Where(v => roomIds.Contains(v.RoomId))
            .ExecuteDeleteAsync(ct);
        await retroDb.RetroCards
            .Where(c => roomIds.Contains(c.RoomId))
            .ExecuteDeleteAsync(ct);
        await retroDb.RetroCardGroups
            .Where(g => roomIds.Contains(g.RoomId))
            .ExecuteDeleteAsync(ct);
        await retroDb.RetroRoomParticipants
            .Where(p => roomIds.Contains(p.RoomId))
            .ExecuteDeleteAsync(ct);
        await retroDb.RetroRooms
            .Where(r => roomIds.Contains(r.Id))
            .ExecuteDeleteAsync(ct);
    }

    public async Task DeleteMembershipsAsync(DbContext db, Guid userId, CancellationToken ct)
    {
        var retroDb = (RetroDbContext)db;
        await retroDb.RetroRoomParticipants
            .Where(p => p.UserId == userId && !p.IsOwner)
            .ExecuteDeleteAsync(ct);
    }

    public async Task<List<RoomMembershipDto>> GetMembershipsAsync(DbContext db, Guid userId, CancellationToken ct)
    {
        var retroDb = (RetroDbContext)db;
        return await retroDb.RetroRoomParticipants
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .Join(retroDb.RetroRooms,
                p => p.RoomId, r => r.Id,
                (p, r) => new RoomMembershipDto(
                    "retro", r.Id, r.Title, p.IsOwner, p.IsAdmin,
                    null, null, p.JoinedAt
                ))
            .ToListAsync(ct);
    }

    public Task<List<object>> GetExportDataAsync(DbContext db, List<Guid> roomIds, Guid userId, CancellationToken ct)
    {
        return Task.FromResult(new List<object>());
    }
}
