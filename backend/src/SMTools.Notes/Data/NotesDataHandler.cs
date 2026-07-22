using Microsoft.EntityFrameworkCore;
using SMTools.Abstractions.Data;
using SMTools.Abstractions.Dtos;

namespace SMTools.Notes.Data;

public sealed class NotesDataHandler : IModuleDataHandler
{
    public string ModuleName => "notes";

    public Task<List<Guid>> GetOwnedRoomIdsAsync(DbContext db, Guid userId, CancellationToken ct)
    {
        return Task.FromResult(new List<Guid>());
    }

    public Task DeleteOwnedRoomDataAsync(DbContext db, List<Guid> roomIds, CancellationToken ct)
    {
        return Task.CompletedTask;
    }

    public Task DeleteMembershipsAsync(DbContext db, Guid userId, CancellationToken ct)
    {
        return Task.CompletedTask;
    }

    public Task<List<RoomMembershipDto>> GetMembershipsAsync(DbContext db, Guid userId, CancellationToken ct)
    {
        return Task.FromResult(new List<RoomMembershipDto>());
    }

    public Task<List<object>> GetExportDataAsync(DbContext db, List<Guid> roomIds, Guid userId, CancellationToken ct)
    {
        return Task.FromResult(new List<object>());
    }
}
