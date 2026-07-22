using Microsoft.EntityFrameworkCore;
using SMTools.Abstractions;
using SMTools.Kanban.Models;

namespace SMTools.Kanban.Data;

public sealed class KanbanRepository(KanbanDbContext db)
    : RoomRepositoryBase<KanbanRoom, KanbanRoomParticipant, KanbanDbContext>(db), IKanbanRepository
{
    public async Task<KanbanRoom?> GetFullRoomStateAsync(Guid roomId, CancellationToken ct)
    {
        return await Db.KanbanRooms
            .AsNoTracking()
            .Include(r => r.Participants)
            .Include(r => r.Columns.OrderBy(c => c.DisplayOrder))
            .Include(r => r.Cards)
                .ThenInclude(c => c.Comments)
            .FirstOrDefaultAsync(r => r.Id == roomId, ct);
    }

    public async Task<KanbanRoomParticipant?> GetParticipantAsync(Guid participantId, Guid roomId, CancellationToken ct)
    {
        return await Db.KanbanRoomParticipants
            .FirstOrDefaultAsync(p => p.Id == participantId && p.RoomId == roomId, ct);
    }

    public async Task<bool> ParticipantExistsAsync(Guid roomId, Guid participantId, CancellationToken ct)
    {
        return await Db.KanbanRoomParticipants
            .AnyAsync(p => p.Id == participantId && p.RoomId == roomId, ct);
    }

    public async Task<KanbanColumn?> GetColumnAsync(Guid columnId, Guid roomId, CancellationToken ct)
    {
        return await Db.KanbanColumns
            .FirstOrDefaultAsync(c => c.Id == columnId && c.RoomId == roomId, ct);
    }

    public async Task AddColumnAsync(KanbanColumn column, CancellationToken ct)
    {
        await AddAsync(column, ct);
    }

    public async Task DeleteColumnAsync(Guid columnId, CancellationToken ct)
    {
        await RemoveByIdAsync<KanbanColumn>(columnId, ct);
    }

    public async Task<int> GetNextColumnOrderAsync(Guid roomId, CancellationToken ct)
    {
        return await Db.KanbanColumns
            .Where(c => c.RoomId == roomId)
            .Select(c => (int?)c.DisplayOrder)
            .DefaultIfEmpty()
            .MaxAsync(ct) ?? 0;
    }

    public async Task<List<KanbanColumn>> GetAllColumnsAsync(Guid roomId, CancellationToken ct)
    {
        return await Db.KanbanColumns
            .Where(c => c.RoomId == roomId)
            .ToListAsync(ct);
    }

    public async Task<KanbanCard?> GetCardAsync(Guid cardId, Guid roomId, CancellationToken ct)
    {
        return await Db.KanbanCards
            .FirstOrDefaultAsync(c => c.Id == cardId && c.RoomId == roomId, ct);
    }

    public async Task AddCardAsync(KanbanCard card, CancellationToken ct)
    {
        await AddAsync(card, ct);
    }

    public Task DeleteCardAsync(Guid cardId)
    {
        return SoftDeleteAsync<KanbanCard>(cardId, default);
    }

    public async Task<List<KanbanCard>> GetCardsByColumnAsync(Guid columnId, CancellationToken ct)
    {
        return await Db.KanbanCards
            .Where(c => c.ColumnId == columnId)
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Id)
            .ToListAsync(ct);
    }

    public async Task<int> GetNextCardOrderAsync(Guid columnId, CancellationToken ct)
    {
        return await Db.KanbanCards
            .Where(c => c.ColumnId == columnId)
            .Select(c => (int?)c.DisplayOrder)
            .DefaultIfEmpty()
            .MaxAsync(ct) ?? 0;
    }

    public async Task<KanbanCardComment?> GetCommentAsync(Guid cardId, Guid commentId, CancellationToken ct)
    {
        return await Db.KanbanCardComments
            .FirstOrDefaultAsync(c => c.Id == commentId && c.CardId == cardId, ct);
    }

    public async Task AddCommentAsync(KanbanCardComment comment, CancellationToken ct)
    {
        await AddAsync(comment, ct);
    }

    public Task DeleteCommentAsync(KanbanCardComment comment)
    {
        return SoftDeleteAsync<KanbanCardComment>(comment.Id, default);
    }
}
