using Microsoft.AspNetCore.SignalR;

namespace SMTools.Abstractions;

public sealed class SignalRRoomClosedNotifier<THub> : IRoomClosedNotifier
    where THub : Hub
{
    private readonly IHubContext<THub> _hubContext;

    public SignalRRoomClosedNotifier(IHubContext<THub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyRoomClosedAsync(Guid roomId, string message, CancellationToken ct)
    {
        await _hubContext.Clients.Group(roomId.ToString()).SendAsync("RoomClosed", message, ct);
    }

}
