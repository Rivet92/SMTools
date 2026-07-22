using System.Text.Json.Serialization;

namespace SMTools.Retro.Models;

public sealed class RetroActionItem
{
    public Guid Id { get; set; }

    public Guid RoomId { get; set; }

    [JsonIgnore]
    public RetroRoom Room { get; set; } = null!;

    public string Content { get; set; } = string.Empty;

    public Guid? AssigneeParticipantId { get; set; }

    [JsonIgnore]
    public RetroRoomParticipant? Assignee { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}
