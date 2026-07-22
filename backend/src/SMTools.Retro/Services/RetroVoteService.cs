using SMTools.Abstractions;
using SMTools.Abstractions.Exceptions;
using SMTools.Retro.Data;
using SMTools.Retro.DTOs.Hubs;
using SMTools.Retro.Exceptions;

using SMTools.Retro.Models;

namespace SMTools.Retro.Services;

public sealed class RetroVoteService : IRetroVoteService
{
    private const int MaxVotesPerParticipant = 5;
    private readonly IRetroRepository _repo;
    private readonly IStateBuilder<RetroRoomStateDto> _stateBuilder;
    private readonly IUnitOfWork<RetroDbContext> _uow;

    public RetroVoteService(IRetroRepository repo, IStateBuilder<RetroRoomStateDto> stateBuilder, IUnitOfWork<RetroDbContext> uow)
    {
        _repo = repo;
        _stateBuilder = stateBuilder;
        _uow = uow;
    }

    public async Task<RetroRoomStateDto> AddVotePointAsync(
        Guid roomId, Guid cardId, Guid participantId, CancellationToken ct)
    {
        var room = await _repo.GetRoomAsync(roomId, ct);
        if (room is null)
            throw new NotFoundException<RetroRoom>(roomId);

        if (room.Phase != RetroPhase.Voting)
            throw new BusinessRuleException("Voting is only allowed during the voting phase.");

        var card = await _repo.GetCardAsync(cardId, roomId, ct);
        if (card is null)
            throw new NotFoundException<RetroCard>(cardId);

        await using var tx = await _uow.BeginTransactionAsync(ct);

        await _repo.LockVoteResourcesAsync(roomId, participantId, ct);

        var usedPoints = await _repo.GetUsedVotePointsAsync(roomId, participantId, ct);
        if (usedPoints >= MaxVotesPerParticipant)
            throw new VoteLimitExceededException(MaxVotesPerParticipant);

        var existingVote = await _repo.GetVoteAsync(cardId, participantId, ct);

        if (existingVote is null)
        {
            await _repo.AddVoteAsync(new RetroVote
            {
                Id = Guid.NewGuid(),
                RoomId = roomId,
                CardId = cardId,
                ParticipantId = participantId,
                Points = 1,
                CreatedAt = DateTimeOffset.UtcNow,
            }, ct);
        }
        else
        {
            existingVote.Points += 1;
        }

        await _uow.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        return await _stateBuilder.BuildStateAsync(roomId, participantId, ct);
    }

    public async Task<RetroRoomStateDto> RemoveVotePointAsync(
        Guid roomId, Guid cardId, Guid participantId, CancellationToken ct)
    {
        var room = await _repo.GetRoomAsync(roomId, ct);
        if (room is null)
            throw new NotFoundException<RetroRoom>(roomId);

        if (room.Phase != RetroPhase.Voting)
            throw new BusinessRuleException("Voting phase required to remove vote points.");

        var existingVote = await _repo.GetVoteAsync(cardId, participantId, ct);

        if (existingVote is not null)
        {
            if (existingVote.Points <= 1)
                await _repo.DeleteVoteAsync(existingVote.Id);
            else
                existingVote.Points -= 1;

            await _uow.SaveChangesAsync(ct);
        }

        return await _stateBuilder.BuildStateAsync(roomId, participantId, ct);
    }
}
