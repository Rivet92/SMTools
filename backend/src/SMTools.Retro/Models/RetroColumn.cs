using System.Text.Json.Serialization;

namespace SMTools.Retro.Models;

public sealed class RetroColumn
{
    public Guid Id { get; set; }

    public Guid TemplateId { get; set; }

    [JsonIgnore]
    public RetroTemplate Template { get; set; } = null!;

    public string Key { get; set; } = string.Empty;

    public int DisplayOrder { get; set; }

    public string Color { get; set; } = string.Empty;

    public string Icon { get; set; } = string.Empty;

    [JsonIgnore]
    public ICollection<RetroCard> Cards { get; set; } = new List<RetroCard>();
}
