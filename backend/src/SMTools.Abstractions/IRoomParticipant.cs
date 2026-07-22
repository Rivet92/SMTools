namespace SMTools.Abstractions;

public interface IRoomParticipant
{
    Guid Id { get; set; }
    Guid RoomId { get; set; }
    string ConnectionId { get; set; }
    string DisplayName { get; set; }
    Guid? UserId { get; set; }
    bool IsOwner { get; set; }
    bool IsAdmin { get; set; }
    bool IsConnected { get; set; }
    bool HasLeft { get; set; }
    DateTimeOffset JoinedAt { get; set; }
}
