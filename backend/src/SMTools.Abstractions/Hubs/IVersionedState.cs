namespace SMTools.Abstractions.Hubs;

public interface IVersionedState
{
    int Version { get; set; }
}
