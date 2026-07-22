using System.Text.Json.Serialization;

namespace SMTools.Retro.Models;

public sealed class RetroCardGroup
{
    public Guid Id { get; set; }

    public Guid RoomId { get; set; }

    [JsonIgnore]
    public RetroRoom Room { get; set; } = null!;

    public string Title { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    [JsonIgnore]
    public ICollection<RetroCard> Cards { get; set; } = new List<RetroCard>();
}
