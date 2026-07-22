using System.Security.Claims;

namespace SMTools.Abstractions.Endpoints;

public interface IRoomEndpointHandler<TCreateRequest, TCreateResponse, TMyRoomResponse, TResultsResponse>
    where TCreateRequest : ICreateRoomRequest
{
    Task<TCreateResponse> CreateRoomAsync(TCreateRequest request, ClaimsPrincipal user, CancellationToken ct);
    Task<List<TMyRoomResponse>> GetMyRoomsAsync(Guid userId, CancellationToken ct);
    Task<LeaveRoomResult> LeaveRoomAsync(Guid roomId, Guid userId, CancellationToken ct);
    Task DeleteRoomAsync(Guid roomId, Guid userId, CancellationToken ct);
    Task<TResultsResponse> GetResultsAsync(Guid roomId, Guid userId, CancellationToken ct);
}
