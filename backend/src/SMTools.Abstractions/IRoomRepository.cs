using SMTools.Abstractions.Dtos;

namespace SMTools.Abstractions;

public interface IRoomRepository<TRoom, TParticipant>
    where TRoom : class, IRoom
    where TParticipant : class, IRoomParticipant
{
    Task<TRoom?> GetRoomAsync(Guid roomId, CancellationToken ct);
    Task AddRoomAsync(TRoom room, CancellationToken ct);
    Task DeleteRoomAsync(Guid roomId, CancellationToken ct);
    Task<bool> IsRoomOwnerAsync(Guid roomId, Guid userId, CancellationToken ct);

    Task<TParticipant?> GetParticipantByUserAsync(Guid roomId, Guid userId, CancellationToken ct);
    Task AddParticipantAsync(TParticipant participant, CancellationToken ct);
    Task<bool> HasParticipantsAsync(Guid roomId, CancellationToken ct);

    Task<List<MyRoomResponse>> GetMyRoomsAsync(Guid userId, CancellationToken ct);
}
