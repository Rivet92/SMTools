using SMTools.Retro.DTOs.Hubs;

namespace SMTools.Retro.Services;

public interface IRetroVoteService
{
    Task<RetroRoomStateDto> AddVotePointAsync(
        Guid roomId, Guid cardId, Guid participantId, CancellationToken ct);

    Task<RetroRoomStateDto> RemoveVotePointAsync(
        Guid roomId, Guid cardId, Guid participantId, CancellationToken ct);
}
