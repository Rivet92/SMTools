using SMTools.Retro.DTOs.Hubs;

namespace SMTools.Retro.Services;

public interface IRetroCardService
{
    Task<RetroRoomStateDto> AddCardAsync(
        Guid roomId, Guid columnId, string content,
        Guid authorParticipantId, CancellationToken ct);

    Task<RetroRoomStateDto> MoveCardToGroupAsync(
        Guid roomId, Guid cardId, Guid? groupId,
        Guid callerParticipantId, CancellationToken ct);

    Task<RetroRoomStateDto> CreateGroupFromCardsAsync(
        Guid roomId, string title, Guid firstCardId, Guid secondCardId,
        Guid callerParticipantId, CancellationToken ct);

    Task<RetroRoomStateDto> DeleteCardAsync(
        Guid roomId, Guid cardId,
        Guid callerParticipantId, CancellationToken ct);
}
