using Microsoft.EntityFrameworkCore;
using SMTools.Abstractions;
using SMTools.Abstractions.Dtos;
using SMTools.Retro.DTOs.Apis;
using SMTools.Retro.DTOs.Hubs;
using SMTools.Retro.Models;

namespace SMTools.Retro.Data;

public sealed class RetroRepository(RetroDbContext db)
    : RoomRepositoryBase<RetroRoom, RetroRoomParticipant, RetroDbContext>(db), IRetroRepository
{
    public async Task<RetroRoom?> GetFullRoomStateAsync(Guid roomId, CancellationToken ct)
    {
        return await Db.RetroRooms
            .AsNoTracking()
            .Include(r => r.Participants)
            .Include(r => r.Template)
                .ThenInclude(t => t.Columns.OrderBy(c => c.DisplayOrder))
            .Include(r => r.Cards)
                .ThenInclude(c => c.Votes)
            .Include(r => r.Groups)
            .Include(r => r.ActionItems)
            .FirstOrDefaultAsync(r => r.Id == roomId, ct);
    }

    public async Task<List<ParticipantDto>> GetParticipantsAsync(Guid roomId, CancellationToken ct)
    {
        return await Db.RetroRoomParticipants
            .AsNoTracking()
            .Where(p => p.RoomId == roomId)
            .OrderBy(p => p.JoinedAt)
            .Select(p => new ParticipantDto(p.Id, p.DisplayName, p.IsOwner, p.IsAdmin, p.IsConnected))
            .ToListAsync(ct);
    }

    public async Task<RetroRoomParticipant?> GetParticipantAsync(Guid participantId, Guid roomId, CancellationToken ct)
    {
        return await Db.RetroRoomParticipants
            .FirstOrDefaultAsync(p => p.Id == participantId && p.RoomId == roomId, ct);
    }

    public async Task<List<RetroTemplateResponse>> GetTemplatesAsync(CancellationToken ct)
    {
        return await Db.RetroTemplates
            .AsNoTracking()
            .OrderBy(t => t.Id)
            .Select(t => new RetroTemplateResponse(
                t.Id,
                t.Key,
                t.IsDefault,
                t.Columns
                    .OrderBy(c => c.DisplayOrder)
                    .Select(c => new RetroColumnDto(c.Id, c.Key, c.DisplayOrder, c.Color, c.Icon))
                    .ToList()
            ))
            .ToListAsync(ct);
    }

    public async Task<Guid> GetDefaultTemplateIdAsync(CancellationToken ct)
    {
        return await Db.RetroTemplates
            .Where(t => t.IsDefault)
            .Select(t => t.Id)
            .FirstOrDefaultAsync(ct);
    }

    public async Task<bool> ColumnExistsAsync(Guid columnId, Guid templateId, CancellationToken ct)
    {
        return await Db.RetroColumns
            .AnyAsync(c => c.Id == columnId && c.TemplateId == templateId, ct);
    }

    public async Task<RetroCard?> GetCardAsync(Guid cardId, Guid roomId, CancellationToken ct)
    {
        return await Db.RetroCards
            .FirstOrDefaultAsync(c => c.Id == cardId && c.RoomId == roomId, ct);
    }

    public async Task AddCardAsync(RetroCard card, CancellationToken ct)
    {
        await AddAsync(card, ct);
    }

    public async Task DeleteCardAsync(Guid cardId, CancellationToken ct)
    {
        await SoftDeleteAsync<RetroCard>(cardId, ct);
    }

    public async Task<List<RetroCard>> GetCardsByGroupAsync(Guid groupId, CancellationToken ct)
    {
        return await Db.RetroCards
            .Where(c => c.GroupId == groupId)
            .ToListAsync(ct);
    }

    public async Task<RetroCardGroup?> GetGroupAsync(Guid groupId, Guid roomId, CancellationToken ct)
    {
        return await Db.RetroCardGroups
            .FirstOrDefaultAsync(g => g.Id == groupId && g.RoomId == roomId, ct);
    }

    public async Task AddGroupAsync(RetroCardGroup group, CancellationToken ct)
    {
        await AddAsync(group, ct);
    }

    public async Task DeleteGroupAsync(Guid groupId, CancellationToken ct)
    {
        await RemoveByIdAsync<RetroCardGroup>(groupId, ct);
    }

    public async Task<int> GetUsedVotePointsAsync(Guid roomId, Guid participantId, CancellationToken ct)
    {
        return await Db.RetroVotes
            .Where(v => v.RoomId == roomId && v.ParticipantId == participantId && v.DeletedAt == null)
            .SumAsync(v => v.Points, ct);
    }

    public async Task<RetroVote?> GetVoteAsync(Guid cardId, Guid participantId, CancellationToken ct)
    {
        return await Db.RetroVotes
            .FirstOrDefaultAsync(v => v.CardId == cardId && v.ParticipantId == participantId && v.DeletedAt == null, ct);
    }

    public async Task AddVoteAsync(RetroVote vote, CancellationToken ct)
    {
        await AddAsync(vote, ct);
    }

    public async Task DeleteVoteAsync(Guid voteId)
    {
        await SoftDeleteAsync<RetroVote>(voteId, default);
    }

    public async Task<RetroActionItem?> GetActionItemAsync(Guid actionItemId, Guid roomId, CancellationToken ct)
    {
        return await Db.RetroActionItems
            .FirstOrDefaultAsync(a => a.Id == actionItemId && a.RoomId == roomId, ct);
    }

    public async Task AddActionItemAsync(RetroActionItem actionItem, CancellationToken ct)
    {
        await AddAsync(actionItem, ct);
    }

    public async Task DeleteActionItemAsync(Guid actionItemId, CancellationToken ct)
    {
        await RemoveByIdAsync<RetroActionItem>(actionItemId, ct);
    }

    public async Task LockVoteResourcesAsync(Guid roomId, Guid participantId, CancellationToken ct)
    {
        if (Db.Database.ProviderName?.Contains("Npgsql") == true)
        {
            await Db.Database.ExecuteSqlInterpolatedAsync(
                $@"SELECT 1 FROM retro.""RetroVotes"" WHERE ""RoomId"" = {roomId} AND ""ParticipantId"" = {participantId} FOR UPDATE",
                ct);
            await Db.Database.ExecuteSqlInterpolatedAsync(
                $@"SELECT 1 FROM retro.""RetroRoomParticipants"" WHERE ""Id"" = {participantId} FOR UPDATE",
                ct);
        }
    }

    public async Task DeleteVotesForCardAsync(Guid cardId, CancellationToken ct)
    {
        await Db.RetroVotes
            .Where(v => v.CardId == cardId)
            .ExecuteUpdateAsync(s => s.SetProperty(v => v.DeletedAt, DateTimeOffset.UtcNow), ct);
    }
}
