namespace SMTools.Abstractions.Dtos;

public sealed record RoomMembershipDto(
    string Module,
    Guid RoomId,
    string RoomTitle,
    bool IsOwner,
    bool IsAdmin,
    Guid? OwnerParticipantId,
    string? OwnerName,
    DateTimeOffset JoinedAt
);
