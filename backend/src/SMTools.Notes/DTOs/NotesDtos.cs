namespace SMTools.Notes.DTOs;

public sealed record NoteDto(
    Guid Id,
    Guid UserId,
    string Title,
    string? Content,
    bool IsArchived,
    int Position,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt
);

public sealed record CreateNoteRequest(string? Title, string? Content);

public sealed record UpdateNoteRequest(string? Title, string? Content);

public sealed record NoteReorderItem(Guid NoteId, int Position, bool? IsArchived = null);

public sealed record ReorderNotesRequest(List<NoteReorderItem> Updates);
