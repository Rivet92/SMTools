namespace SMTools.Abstractions.Dtos;

public sealed record MyRoomResponse(
    Guid Id,
    string Title,
    DateTimeOffset CreatedAt,
    bool IsOwner,
    bool IsAdmin
);
