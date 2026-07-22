namespace SMTools.Abstractions;

internal sealed class NullRoomClosedNotifier : IRoomClosedNotifier
{
    public static readonly NullRoomClosedNotifier Instance = new();
    private NullRoomClosedNotifier() { }
    public Task NotifyRoomClosedAsync(Guid roomId, string message, CancellationToken ct) => Task.CompletedTask;
}
