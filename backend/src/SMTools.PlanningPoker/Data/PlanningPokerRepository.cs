using Microsoft.EntityFrameworkCore;
using SMTools.Abstractions;
using SMTools.PlanningPoker.DTOs.Apis;
using SMTools.PlanningPoker.Models;

namespace SMTools.PlanningPoker.Data;

public sealed class PlanningPokerRepository(PlanningPokerDbContext db)
    : RoomRepositoryBase<PlanningPokerRoom, PlanningPokerRoomParticipant, PlanningPokerDbContext>(db), IPlanningPokerRepository
{
    public async Task<PlanningPokerRoom?> GetFullRoomStateAsync(Guid roomId, CancellationToken ct)
    {
        var room = await Db.PlanningPokerRooms
            .Include(r => r.Participants)
            .FirstOrDefaultAsync(r => r.Id == roomId, ct);

        if (room is not null)
        {
            room.VoteItems = await Db.PlanningPokerVoteItems
                .Where(vi => vi.RoomId == roomId)
                .Include(vi => vi.Votes)
                    .ThenInclude(v => v.Participant)
                .OrderBy(vi => vi.CreatedAt)
                .ToListAsync(ct);
        }

        return room;
    }

    public async Task<PlanningPokerVoteItem?> GetVoteItemAsync(Guid voteItemId, Guid roomId, CancellationToken ct)
    {
        return await Db.PlanningPokerVoteItems
            .FirstOrDefaultAsync(vi => vi.Id == voteItemId && vi.RoomId == roomId, ct);
    }

    public async Task AddVoteItemAsync(PlanningPokerVoteItem voteItem, CancellationToken ct)
    {
        await AddAsync(voteItem, ct);
    }

    public async Task DeleteVoteItemAsync(Guid voteItemId, CancellationToken ct)
    {
        await RemoveByIdAsync<PlanningPokerVoteItem>(voteItemId, ct);
    }

    public async Task<PlanningPokerVote?> GetVoteAsync(Guid voteItemId, Guid participantId, CancellationToken ct)
    {
        return await Db.PlanningPokerVotes
            .FirstOrDefaultAsync(v => v.VoteItemId == voteItemId && v.ParticipantId == participantId, ct);
    }

    public async Task AddVoteAsync(PlanningPokerVote vote, CancellationToken ct)
    {
        await AddAsync(vote, ct);
    }

    public async Task DeleteVotesForItemAsync(Guid voteItemId, CancellationToken ct)
    {
        await Db.PlanningPokerVotes
            .Where(v => v.VoteItemId == voteItemId)
            .ExecuteUpdateAsync(s => s.SetProperty(v => v.DeletedAt, DateTimeOffset.UtcNow), ct);
    }

    public async Task<List<PlanningPokerDeckDto>> GetDecksAsync(CancellationToken ct)
    {
        return await Db.PlanningPokerDecks
            .AsNoTracking()
            .OrderBy(d => d.Id)
            .Select(d => new PlanningPokerDeckDto(
                d.Id,
                d.Key,
                d.IsDefault,
                d.Cards
                    .OrderBy(c => c.DisplayOrder)
                    .Select(c => new PlanningPokerCardDto(c.Id, c.Value, c.DisplayOrder))
                    .ToList()
            ))
            .ToListAsync(ct);
    }

    public async Task<Guid> GetDefaultDeckIdAsync(CancellationToken ct)
    {
        return await Db.PlanningPokerDecks
            .Where(d => d.IsDefault)
            .Select(d => d.Id)
            .FirstOrDefaultAsync(ct);
    }

    public async Task LockVoteItemAsync(Guid voteItemId, CancellationToken ct)
    {
        if (Db.Database.ProviderName?.Contains("Npgsql") == true)
        {
            await Db.Database.ExecuteSqlRawAsync(
                @"SELECT 1 FROM planningpoker.""PlanningPokerVoteItems"" WHERE ""Id"" = {0} FOR UPDATE",
                [voteItemId], ct);
        }
    }

    public void ClearChangeTracker()
    {
        Db.ChangeTracker.Clear();
    }
}
