using SMTools.Retro.DTOs.Hubs;

namespace SMTools.Retro.Services;

public interface IRetroActionItemService
{
    Task<RetroRoomStateDto> AddActionItemAsync(
        Guid roomId, string content, Guid? assigneeParticipantId,
        Guid callerParticipantId, CancellationToken ct);

    Task<RetroRoomStateDto> DeleteActionItemAsync(
        Guid roomId, Guid actionItemId,
        Guid callerParticipantId, CancellationToken ct);

    Task<RetroRoomStateDto> AssignActionItemAsync(
        Guid roomId, Guid actionItemId, Guid? assigneeParticipantId,
        Guid callerParticipantId, CancellationToken ct);
}
