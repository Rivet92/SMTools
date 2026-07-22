namespace SMTools.Abstractions;

public interface IRoom
{
    Guid Id { get; set; }
    string Title { get; set; }
    DateTimeOffset CreatedAt { get; set; }
    [SkipAudit]
    string? PasswordHash { get; set; }
}
