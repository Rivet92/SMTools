namespace SMTools.Abstractions.Hubs;

public interface IRoomVersionStore
{
    int NextVersion(Guid roomId);
    int GetCurrentVersion(Guid roomId);
    void Clear(Guid roomId);
}
