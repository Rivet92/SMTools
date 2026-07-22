using SMTools.Abstractions;
using System.Text.Json.Serialization;
using SMTools.Abstractions.ValueObjects;

namespace SMTools.Kanban.Models;

public sealed class KanbanRoom : IRoom
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public string? PasswordHash
    {
        get => RoomPassword?.Hash;
        set => RoomPassword = value is not null ? Password.FromHash(value) : null;
    }

    [JsonIgnore]
    public Password? RoomPassword { get; set; }

    [JsonIgnore]
    public ICollection<KanbanRoomParticipant> Participants { get; set; } = new List<KanbanRoomParticipant>();

    [JsonIgnore]
    public ICollection<KanbanColumn> Columns { get; set; } = new List<KanbanColumn>();

    [JsonIgnore]
    public ICollection<KanbanCard> Cards { get; set; } = new List<KanbanCard>();

    [JsonIgnore]
    public bool HasPassword => RoomPassword is not null;
}
