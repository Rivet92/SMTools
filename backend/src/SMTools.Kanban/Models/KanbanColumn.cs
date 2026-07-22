using System.Text.Json.Serialization;

namespace SMTools.Kanban.Models;

public sealed class KanbanColumn
{
    public Guid Id { get; set; }

    public Guid RoomId { get; set; }

    [JsonIgnore]
    public KanbanRoom Room { get; set; } = null!;

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int DisplayOrder { get; set; }

    [JsonIgnore]
    public ICollection<KanbanCard> Cards { get; set; } = new List<KanbanCard>();
}
