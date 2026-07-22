namespace SMTools.Abstractions.Dtos;

public sealed record ParticipantDto(
    Guid Id,
    string DisplayName,
    bool IsOwner,
    bool IsAdmin,
    bool IsConnected
);
