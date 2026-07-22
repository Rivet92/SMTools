namespace SMTools.Abstractions;

public interface ISoftDeletable
{
    DateTimeOffset? DeletedAt { get; set; }
}
