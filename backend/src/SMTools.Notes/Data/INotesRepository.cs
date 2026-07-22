using SMTools.Abstractions;
using SMTools.Notes.DTOs;
using SMTools.Notes.Models;

namespace SMTools.Notes.Data;

public interface INotesRepository
{
    Task<PagedResponse<NoteDto>> GetNotesPagedAsync(Guid userId, bool? archived, PagedRequest paging, CancellationToken ct);
    Task<Note?> GetNoteForUpdateAsync(Guid noteId, Guid userId, CancellationToken ct);
    Task AddNoteAsync(Note note, CancellationToken ct);
    Task DeleteNoteAsync(Guid noteId, CancellationToken ct);
    Task<int> GetMaxPositionAsync(Guid userId, CancellationToken ct);
    Task<List<Note>> GetNotesByIdsForReorderAsync(List<Guid> noteIds, Guid userId, CancellationToken ct);
}
