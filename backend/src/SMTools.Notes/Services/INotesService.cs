using SMTools.Abstractions;
using SMTools.Notes.DTOs;

namespace SMTools.Notes.Services;

public interface INotesService
{
    Task<PagedResponse<NoteDto>> GetNotesPagedAsync(
        Guid userId,
        bool? archived,
        PagedRequest paging,
        CancellationToken ct);

    Task<NoteDto> CreateNoteAsync(
        Guid userId,
        CreateNoteRequest request,
        CancellationToken ct);

    Task<NoteDto> UpdateNoteAsync(
        Guid noteId,
        Guid userId,
        UpdateNoteRequest request,
        CancellationToken ct);

    Task DeleteNoteAsync(
        Guid noteId,
        Guid userId,
        CancellationToken ct);

    Task<NoteDto> ToggleArchiveAsync(
        Guid noteId,
        Guid userId,
        CancellationToken ct);

    Task ReorderNotesAsync(
        Guid userId,
        ReorderNotesRequest request,
        CancellationToken ct);
}
