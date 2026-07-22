using SMTools.Notes.Models;

namespace SMTools.Notes.DTOs;

public static class NotesMappings
{
    public static NoteDto ToDto(this Note note) => new(
        note.Id,
        note.UserId,
        note.Title,
        note.Content,
        note.IsArchived,
        note.Position,
        note.CreatedAt,
        note.UpdatedAt
    );
}
