using Microsoft.EntityFrameworkCore;
using SMTools.Abstractions.Dtos;

namespace SMTools.Abstractions;

public abstract class RoomRepositoryBase<TRoom, TParticipant, TDbContext> : IRoomRepository<TRoom, TParticipant>
    where TRoom : class, IRoom
    where TParticipant : class, IRoomParticipant
    where TDbContext : DbContext
{
    protected readonly TDbContext Db;

    protected RoomRepositoryBase(TDbContext db)
    {
        Db = db;
    }

    public virtual Task<TRoom?> GetRoomAsync(Guid roomId, CancellationToken ct)
    {
        return Db.Set<TRoom>().FirstOrDefaultAsync(r => r.Id == roomId, ct);
    }

    protected async Task AddAsync<T>(T entity, CancellationToken ct) where T : class
    {
        await Db.Set<T>().AddAsync(entity, ct);
    }

    protected async Task RemoveByIdAsync<T>(Guid id, CancellationToken ct) where T : class
    {
        var entity = await Db.Set<T>().FindAsync([id], ct);
        if (entity is not null)
            Db.Set<T>().Remove(entity);
    }

    protected async Task SoftDeleteAsync<T>(Guid id, CancellationToken ct) where T : class, IEntity, ISoftDeletable
    {
        await Db.Set<T>()
            .Where(e => e.Id == id)
            .ExecuteUpdateAsync(s => s.SetProperty(e => e.DeletedAt, DateTimeOffset.UtcNow), ct);
    }

    public virtual async Task AddRoomAsync(TRoom room, CancellationToken ct)
    {
        await AddAsync(room, ct);
    }

    public virtual async Task DeleteRoomAsync(Guid roomId, CancellationToken ct)
    {
        var room = await Db.Set<TRoom>().FindAsync([roomId], ct);
        if (room is not null)
            Db.Set<TRoom>().Remove(room);
    }

    public virtual Task<bool> IsRoomOwnerAsync(Guid roomId, Guid userId, CancellationToken ct)
    {
        return Db.Set<TParticipant>()
            .AnyAsync(p => p.RoomId == roomId && p.UserId == userId && p.IsOwner, ct);
    }

    public virtual Task<TParticipant?> GetParticipantByUserAsync(Guid roomId, Guid userId, CancellationToken ct)
    {
        return Db.Set<TParticipant>()
            .FirstOrDefaultAsync(p => p.RoomId == roomId && p.UserId == userId, ct);
    }

    public virtual async Task AddParticipantAsync(TParticipant participant, CancellationToken ct)
    {
        await Db.Set<TParticipant>().AddAsync(participant, ct);
    }

    public virtual Task<bool> HasParticipantsAsync(Guid roomId, CancellationToken ct)
    {
        return Db.Set<TParticipant>()
            .AnyAsync(p => p.RoomId == roomId && !p.HasLeft, ct);
    }

    public virtual async Task<List<MyRoomResponse>> GetMyRoomsAsync(Guid userId, CancellationToken ct)
    {
        return await Db.Set<TRoom>()
            .Join(Db.Set<TParticipant>(),
                room => room.Id,
                participant => participant.RoomId,
                (room, participant) => new { Room = room, Participant = participant })
            .Where(x => x.Participant.UserId == userId && !x.Participant.HasLeft)
            .OrderByDescending(x => x.Room.CreatedAt)
            .Select(x => new MyRoomResponse(
                x.Room.Id,
                x.Room.Title,
                x.Room.CreatedAt,
                x.Participant.IsOwner,
                x.Participant.IsAdmin
            ))
            .ToListAsync(ct);
    }
}
