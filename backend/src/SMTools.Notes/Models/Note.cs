namespace SMTools.Notes.Models;

public sealed class Note
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsArchived { get; private set; }
    public int Position { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public void Archive() => IsArchived = true;

    public void Unarchive() => IsArchived = false;

    public void ToggleArchive() => IsArchived = !IsArchived;

    public void Update(string? title, string? content)
    {
        if (title is not null)
            Title = title.Trim();
        if (content is not null)
            Content = content;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
