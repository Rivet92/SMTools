namespace SMTools.Abstractions;

public interface IRoomClosedNotifier
{
    Task NotifyRoomClosedAsync(Guid roomId, string message, CancellationToken ct);
}
