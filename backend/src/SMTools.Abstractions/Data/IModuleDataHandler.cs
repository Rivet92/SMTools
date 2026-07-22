using Microsoft.EntityFrameworkCore;
using SMTools.Abstractions.Dtos;

namespace SMTools.Abstractions.Data;

public interface IModuleDataHandler
{
    string ModuleName { get; }

    Task<List<Guid>> GetOwnedRoomIdsAsync(DbContext db, Guid userId, CancellationToken ct);

    Task DeleteOwnedRoomDataAsync(DbContext db, List<Guid> roomIds, CancellationToken ct);

    Task DeleteMembershipsAsync(DbContext db, Guid userId, CancellationToken ct);

    Task<List<RoomMembershipDto>> GetMembershipsAsync(DbContext db, Guid userId, CancellationToken ct);

    Task<List<object>> GetExportDataAsync(DbContext db, List<Guid> roomIds, Guid userId, CancellationToken ct);
}
