using System.Text.Json.Serialization;

namespace SMTools.Retro.Models;

public sealed class RetroTemplate
{
    public Guid Id { get; set; }

    public string Key { get; set; } = string.Empty;

    public bool IsDefault { get; set; }

    [JsonIgnore]
    public ICollection<RetroColumn> Columns { get; set; } = new List<RetroColumn>();

    [JsonIgnore]
    public ICollection<RetroRoom> Rooms { get; set; } = new List<RetroRoom>();
}
