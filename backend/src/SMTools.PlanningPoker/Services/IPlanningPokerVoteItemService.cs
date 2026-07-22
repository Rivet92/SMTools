using SMTools.PlanningPoker.DTOs.Apis;
using SMTools.PlanningPoker.DTOs.Hubs;

namespace SMTools.PlanningPoker.Services;

public interface IPlanningPokerVoteItemService
{
    Task<List<PlanningPokerDeckDto>> GetDecksAsync(CancellationToken ct);

    Task<RoomStateDto> AddVoteItemAsync(
        Guid roomId,
        string title,
        Guid participantId,
        CancellationToken ct);

    Task<RoomStateDto> VoteAsync(
        Guid roomId,
        Guid voteItemId,
        string value,
        Guid participantId,
        CancellationToken ct);

    Task<RoomStateDto> RevealVotesAsync(
        Guid roomId,
        Guid voteItemId,
        Guid participantId,
        CancellationToken ct);

    Task<RoomStateDto> ResetVotesAsync(
        Guid roomId,
        Guid voteItemId,
        Guid participantId,
        CancellationToken ct);

    Task<RoomStateDto> HideVotesAsync(
        Guid roomId,
        Guid voteItemId,
        Guid participantId,
        CancellationToken ct);

    Task<RoomStateDto> DeleteVoteItemAsync(
        Guid roomId,
        Guid voteItemId,
        Guid participantId,
        CancellationToken ct);
}
