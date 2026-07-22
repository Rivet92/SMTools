using SMTools.Abstractions;

namespace SMTools.Kanban.DTOs.Apis;

public sealed record CreateKanbanRoomRequest(string Title, string? Password) : ICreateRoomRequest;

public sealed record KanbanRoomResponse(
    Guid Id,
    string Title,
    DateTimeOffset CreatedAt,
    bool HasPassword
) : ICreateRoomResponse;


