using SMTools.Abstractions;
using SMTools.Abstractions.Exceptions;
using SMTools.PlanningPoker.Data;
using SMTools.PlanningPoker.Models;
using SMTools.PlanningPoker.DTOs.Apis;
using SMTools.PlanningPoker.DTOs.Hubs;

namespace SMTools.PlanningPoker.Services;

public sealed class PlanningPokerVoteItemService : IPlanningPokerVoteItemService
{
    private readonly IPlanningPokerRepository _repo;
    private readonly IUnitOfWork<PlanningPokerDbContext> _uow;
    private readonly IStateBuilder<RoomStateDto> _stateBuilder;

    public PlanningPokerVoteItemService(IPlanningPokerRepository repo, IUnitOfWork<PlanningPokerDbContext> uow,
        IStateBuilder<RoomStateDto> stateBuilder)
    {
        _repo = repo;
        _uow = uow;
        _stateBuilder = stateBuilder;
    }

    public async Task<List<PlanningPokerDeckDto>> GetDecksAsync(CancellationToken ct)
    {
        return await _repo.GetDecksAsync(ct);
    }

    public async Task<RoomStateDto> AddVoteItemAsync(Guid roomId, string title, Guid participantId, CancellationToken ct)
    {
        var voteItem = PlanningPokerVoteItem.Create(title, roomId, Guid.NewGuid());

        await _repo.AddVoteItemAsync(voteItem, ct);
        await _uow.SaveChangesAsync(ct);

        var state = await GetRoomStateAsync(roomId, participantId, ct);
        return state;
    }

    public async Task<RoomStateDto> VoteAsync(Guid roomId, Guid voteItemId, string value, Guid participantId, CancellationToken ct)
    {
        var voteItem = await _repo.GetVoteItemAsync(voteItemId, roomId, ct);

        if (voteItem is null)
            throw new NotFoundException<PlanningPokerVoteItem>(voteItemId);

        voteItem.EnsureVotingOpen();

        await using var tx = await _uow.BeginTransactionAsync(ct);

        await _repo.LockVoteItemAsync(voteItemId, ct);

        var existingVote = await _repo.GetVoteAsync(voteItemId, participantId, ct);

        if (existingVote is not null)
        {
            existingVote.UpdateVote(value);
        }
        else
        {
            var newVote = PlanningPokerVote.Create(participantId, value, DateTimeOffset.UtcNow);
            newVote.RoomId = roomId;
            newVote.VoteItemId = voteItemId;
            voteItem.Votes.Add(newVote);
            await _repo.AddVoteAsync(newVote, ct);
        }

        await _uow.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        _repo.ClearChangeTracker();

        return await GetRoomStateAsync(roomId, participantId, ct);
    }

    public async Task<RoomStateDto> RevealVotesAsync(Guid roomId, Guid voteItemId, Guid participantId, CancellationToken ct)
    {
        var voteItem = await _repo.GetVoteItemAsync(voteItemId, roomId, ct);

        if (voteItem is null)
            throw new NotFoundException<PlanningPokerVoteItem>(voteItemId);

        voteItem.Reveal();
        await _uow.SaveChangesAsync(ct);

        return await GetRoomStateAsync(roomId, participantId, ct);
    }

    public async Task<RoomStateDto> ResetVotesAsync(Guid roomId, Guid voteItemId, Guid participantId, CancellationToken ct)
    {
        var voteItem = await _repo.GetVoteItemAsync(voteItemId, roomId, ct);

        if (voteItem is null)
            throw new NotFoundException<PlanningPokerVoteItem>(voteItemId);

        await _repo.DeleteVotesForItemAsync(voteItemId, ct);
        voteItem.Reset();
        await _uow.SaveChangesAsync(ct);

        return await GetRoomStateAsync(roomId, participantId, ct);
    }

    public async Task<RoomStateDto> HideVotesAsync(Guid roomId, Guid voteItemId, Guid participantId, CancellationToken ct)
    {
        var voteItem = await _repo.GetVoteItemAsync(voteItemId, roomId, ct);

        if (voteItem is null)
            throw new NotFoundException<PlanningPokerVoteItem>(voteItemId);

        voteItem.Hide();
        await _uow.SaveChangesAsync(ct);

        return await GetRoomStateAsync(roomId, participantId, ct);
    }

    public async Task<RoomStateDto> DeleteVoteItemAsync(Guid roomId, Guid voteItemId, Guid participantId, CancellationToken ct)
    {
        var voteItem = await _repo.GetVoteItemAsync(voteItemId, roomId, ct);

        if (voteItem is null)
            throw new NotFoundException<PlanningPokerVoteItem>(voteItemId);

        await _repo.DeleteVotesForItemAsync(voteItemId, ct);
        await _repo.DeleteVoteItemAsync(voteItemId, ct);
        await _uow.SaveChangesAsync(ct);

        return await GetRoomStateAsync(roomId, participantId, ct);
    }

    private Task<RoomStateDto> GetRoomStateAsync(Guid roomId, Guid ownParticipantId, CancellationToken ct)
    {
        return _stateBuilder.BuildStateAsync(roomId, ownParticipantId, ct);
    }
}
