using SMTools.Abstractions.Dtos;

namespace SMTools.Identity.DTOs;

public sealed record UpdateProfileRequest(
    string? Name,
    string? AvatarUrl
);

public sealed record AvatarUploadRequest(
    IFormFile File
);

public sealed record ExportAuditEntryDto(
    Guid Id,
    string Action,
    string EntityType,
    string EntityId,
    string? OldValues,
    string? NewValues,
    DateTimeOffset Timestamp,
    string? IpAddress
);

public sealed record ExportDataResponse(
    UserProfileDto Profile,
    IReadOnlyList<NoteDto> Notes,
    IReadOnlyList<RoomMembershipDto> Rooms,
    IReadOnlyList<ExportPlanningPokerVoteItemDto> PlanningPokerVoteItems,
    IReadOnlyList<ExportRetroCardDto> RetroCards,
    IReadOnlyList<ExportRetroActionItemDto> RetroActionItems,
    IReadOnlyList<ExportRetroVoteDto> RetroVotes,
    IReadOnlyList<ExportKanbanCardDto> KanbanCards,
    IReadOnlyList<ExportKanbanCommentDto> KanbanComments,
    IReadOnlyList<ExportAuditEntryDto> AuditEntries
);

public sealed record UserProfileDto(
    Guid Id,
    string Provider,
    string Name,
    string Email,
    string? AvatarUrl,
    DateTimeOffset CreatedAt,
    DateTimeOffset? LastLoginAt
);

public sealed record NoteDto(
    Guid Id,
    string Title,
    string Content,
    bool IsArchived,
    int Position,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);

public sealed record ExportPlanningPokerVoteDto(
    Guid VoteItemId,
    Guid ParticipantId,
    string ParticipantName,
    string Value
);

public sealed record ExportPlanningPokerVoteItemDto(
    Guid VoteItemId,
    string RoomTitle,
    string VoteItemTitle,
    bool IsRevealed,
    string? UserVoteValue,
    IReadOnlyList<ExportPlanningPokerVoteDto> Votes,
    DateTimeOffset VoteItemCreatedAt
);

public sealed record ExportRetroCardDto(
    Guid CardId,
    Guid RoomId,
    string RoomTitle,
    Guid ColumnId,
    string ColumnKey,
    string Content,
    Guid AuthorParticipantId,
    string AuthorName,
    DateTimeOffset CreatedAt
);

public sealed record ExportRetroActionItemDto(
    Guid ActionItemId,
    Guid RoomId,
    string RoomTitle,
    string Content,
    Guid? AssigneeParticipantId,
    string? AssigneeName,
    DateTimeOffset CreatedAt
);

public sealed record ExportRetroVoteDto(
    Guid VoteId,
    Guid RoomId,
    string RoomTitle,
    Guid CardId,
    string CardContent,
    Guid ParticipantId,
    string ParticipantName,
    int Points,
    DateTimeOffset CreatedAt
);

public sealed record ExportKanbanCardDto(
    Guid CardId,
    Guid RoomId,
    string RoomTitle,
    Guid ColumnId,
    string ColumnTitle,
    string Title,
    string? Description,
    Guid AuthorParticipantId,
    string AuthorName,
    Guid? AssigneeParticipantId,
    string? AssigneeName,
    DateTimeOffset CreatedAt
);

public sealed record ExportKanbanCommentDto(
    Guid CommentId,
    Guid CardId,
    string CardTitle,
    Guid RoomId,
    string RoomTitle,
    Guid AuthorParticipantId,
    string AuthorName,
    string Content,
    DateTimeOffset CreatedAt
);
