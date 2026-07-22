using Microsoft.EntityFrameworkCore;
using SMTools.Abstractions;
using SMTools.Notes.DTOs;
using SMTools.Notes.Models;

namespace SMTools.Notes.Data;

public sealed class NotesRepository : INotesRepository
{
    private readonly NotesDbContext _db;

    public NotesRepository(NotesDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResponse<NoteDto>> GetNotesPagedAsync(Guid userId, bool? archived, PagedRequest paging, CancellationToken ct)
    {
        var query = _db.Notes
            .AsNoTracking()
            .Where(n => n.UserId == userId);

        if (archived.HasValue)
            query = query.Where(n => n.IsArchived == archived.Value);

        query = query
            .OrderBy(n => n.IsArchived)
            .ThenBy(n => n.Position);

        var total = await query.CountAsync(ct);

        var page = Math.Max(1, paging.Page ?? 1);
        var pageSize = Math.Clamp(paging.PageSize ?? 10, 1, 100);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new NoteDto(
                n.Id,
                n.UserId,
                n.Title,
                n.Content,
                n.IsArchived,
                n.Position,
                n.CreatedAt,
                n.UpdatedAt
            ))
            .ToListAsync(ct);

        return new PagedResponse<NoteDto>(items, total, page, pageSize);
    }

    public async Task<Note?> GetNoteForUpdateAsync(Guid noteId, Guid userId, CancellationToken ct)
    {
        return await _db.Notes.FirstOrDefaultAsync(n => n.Id == noteId && n.UserId == userId, ct);
    }

    public async Task AddNoteAsync(Note note, CancellationToken ct)
    {
        await _db.Notes.AddAsync(note, ct);
    }

    public async Task DeleteNoteAsync(Guid noteId, CancellationToken ct)
    {
        var note = await _db.Notes.FindAsync(new object[] { noteId }, ct);
        if (note is not null)
            _db.Notes.Remove(note);
    }

    public async Task<int> GetMaxPositionAsync(Guid userId, CancellationToken ct)
    {
        return await _db.Notes
            .Where(n => n.UserId == userId && !n.IsArchived)
            .MaxAsync(n => (int?)n.Position, ct) ?? -1;
    }

    public async Task<List<Note>> GetNotesByIdsForReorderAsync(List<Guid> noteIds, Guid userId, CancellationToken ct)
    {
        return await _db.Notes
            .Where(n => noteIds.Contains(n.Id) && n.UserId == userId)
            .ToListAsync(ct);
    }

}
