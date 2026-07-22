using Microsoft.Extensions.Logging;
using SMTools.Abstractions;
using SMTools.Abstractions.Exceptions;
using SMTools.Notes.Data;
using SMTools.Notes.DTOs;

using SMTools.Notes.Models;

namespace SMTools.Notes.Services;

public sealed class NotesService : INotesService
{
    private readonly INotesRepository _repo;
    private readonly IUnitOfWork<NotesDbContext> _uow;
    private readonly ILogger<NotesService> _logger;

    public NotesService(INotesRepository repo, IUnitOfWork<NotesDbContext> uow, ILogger<NotesService> logger)
    {
        _repo = repo;
        _uow = uow;
        _logger = logger;
    }

    public async Task<PagedResponse<NoteDto>> GetNotesPagedAsync(Guid userId, bool? archived, PagedRequest paging, CancellationToken ct)
    {
        return await _repo.GetNotesPagedAsync(userId, archived, paging, ct);
    }

    public async Task<NoteDto> CreateNoteAsync(Guid userId, CreateNoteRequest request, CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;
        var maxPosition = await _repo.GetMaxPositionAsync(userId, ct);

        var note = new Note
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = (request.Title ?? string.Empty).Trim(),
            Content = request.Content ?? string.Empty,
            Position = maxPosition + 1,
            CreatedAt = now,
            UpdatedAt = now,
        };

        await _repo.AddNoteAsync(note, ct);
        await _uow.SaveChangesAsync(ct);

        return note.ToDto();
    }

    public async Task<NoteDto> UpdateNoteAsync(Guid noteId, Guid userId, UpdateNoteRequest request, CancellationToken ct)
    {
        var note = await _repo.GetNoteForUpdateAsync(noteId, userId, ct);
        if (note is null)
        {
            _logger.LogWarning("Note {NoteId} not found for user {UserId}", noteId, userId);
            throw new NotFoundException<Note>(noteId);
        }

        note.Update(request.Title, request.Content);
        await _uow.SaveChangesAsync(ct);

        return note.ToDto();
    }

    public async Task DeleteNoteAsync(Guid noteId, Guid userId, CancellationToken ct)
    {
        var note = await _repo.GetNoteForUpdateAsync(noteId, userId, ct);
        if (note is null)
        {
            _logger.LogWarning("Note {NoteId} not found for user {UserId} (delete)", noteId, userId);
            throw new NotFoundException<Note>(noteId);
        }

        await _repo.DeleteNoteAsync(noteId, ct);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task<NoteDto> ToggleArchiveAsync(Guid noteId, Guid userId, CancellationToken ct)
    {
        var note = await _repo.GetNoteForUpdateAsync(noteId, userId, ct);
        if (note is null)
        {
            _logger.LogWarning("Note {NoteId} not found for user {UserId} (toggle archive)", noteId, userId);
            throw new NotFoundException<Note>(noteId);
        }

        note.ToggleArchive();
        note.UpdatedAt = DateTimeOffset.UtcNow;
        await _uow.SaveChangesAsync(ct);

        return note.ToDto();
    }

    public async Task ReorderNotesAsync(Guid userId, ReorderNotesRequest request, CancellationToken ct)
    {
        var noteIds = request.Updates.Select(u => u.NoteId).ToList();
        var notes = await _repo.GetNotesByIdsForReorderAsync(noteIds, userId, ct);

        if (notes.Count == 0)
        {
            _logger.LogWarning("No notes found for reorder (user {UserId}, first id {NoteId})", userId, noteIds.First());
            throw new NotFoundException<Note>(noteIds.First());
        }

        foreach (var update in request.Updates)
        {
            var note = notes.FirstOrDefault(n => n.Id == update.NoteId);
            if (note is null) continue;

            note.Position = update.Position;
            note.UpdatedAt = DateTimeOffset.UtcNow;

            if (update.IsArchived.HasValue && update.IsArchived.Value != note.IsArchived)
            {
                if (update.IsArchived.Value)
                    note.Archive();
                else
                    note.Unarchive();
            }
        }

        await _uow.SaveChangesAsync(ct);
    }
}
