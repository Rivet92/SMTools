using SMTools.Abstractions;
using SMTools.Abstractions.Dtos;
using System.Security.Claims;
using SMTools.PlanningPoker.DTOs.Apis;
using SMTools.PlanningPoker.DTOs.Hubs;

namespace SMTools.PlanningPoker.Services;

public interface IPlanningPokerRoomService
{
    Task<PlanningPokerRoomResponse> CreateRoomAsync(
        CreatePlanningPokerRoomRequest request,
        ClaimsPrincipal user,
        CancellationToken ct);

    Task<List<MyRoomResponse>> GetMyRoomsAsync(
        Guid userId,
        CancellationToken ct);

    Task<LeaveRoomResult> LeaveRoomAsync(
        Guid roomId,
        Guid userId,
        CancellationToken ct);

    Task DeleteRoomAsync(
        Guid roomId,
        Guid userId,
        CancellationToken ct);

    Task<RoomStateDto> GetRoomStateAsync(
        Guid roomId,
        Guid ownParticipantId,
        CancellationToken ct);

    Task<RoomStateDto> GetResultsAsync(
        Guid roomId,
        Guid userId,
        CancellationToken ct);
}
