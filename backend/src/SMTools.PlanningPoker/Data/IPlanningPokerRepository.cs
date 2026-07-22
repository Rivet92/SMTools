using SMTools.Abstractions;
using SMTools.Abstractions.Dtos;
using SMTools.PlanningPoker.DTOs.Apis;
using SMTools.PlanningPoker.DTOs.Hubs;
using SMTools.PlanningPoker.Models;

namespace SMTools.PlanningPoker.Data;

public interface IPlanningPokerRepository : IRoomRepository<PlanningPokerRoom, PlanningPokerRoomParticipant>
{
    Task<PlanningPokerRoom?> GetFullRoomStateAsync(Guid roomId, CancellationToken ct);

    Task<PlanningPokerVoteItem?> GetVoteItemAsync(Guid voteItemId, Guid roomId, CancellationToken ct);
    Task AddVoteItemAsync(PlanningPokerVoteItem voteItem, CancellationToken ct);
    Task DeleteVoteItemAsync(Guid voteItemId, CancellationToken ct);

    Task<PlanningPokerVote?> GetVoteAsync(Guid voteItemId, Guid participantId, CancellationToken ct);
    Task AddVoteAsync(PlanningPokerVote vote, CancellationToken ct);
    Task DeleteVotesForItemAsync(Guid voteItemId, CancellationToken ct);

    Task<List<PlanningPokerDeckDto>> GetDecksAsync(CancellationToken ct);
    Task<Guid> GetDefaultDeckIdAsync(CancellationToken ct);

    Task LockVoteItemAsync(Guid voteItemId, CancellationToken ct);
    void ClearChangeTracker();
}
