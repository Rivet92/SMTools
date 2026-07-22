using SMTools.Abstractions;
using SMTools.Abstractions.Dtos;
using System.Security.Claims;
using SMTools.Kanban.DTOs.Apis;
using SMTools.Kanban.DTOs.Hubs;

namespace SMTools.Kanban.Services;

public interface IKanbanRoomService
{
    Task<KanbanRoomResponse> CreateRoomAsync(
        CreateKanbanRoomRequest request,
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

    Task<KanbanRoomStateDto> GetRoomStateAsync(
        Guid roomId,
        Guid ownParticipantId,
        CancellationToken ct);

    Task<KanbanRoomStateDto> GetResultsAsync(
        Guid roomId,
        Guid userId,
        CancellationToken ct);
}
