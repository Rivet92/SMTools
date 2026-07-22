using SMTools.Abstractions;
using SMTools.Abstractions.Dtos;
using System.Security.Claims;
using SMTools.Retro.DTOs.Apis;
using SMTools.Retro.DTOs.Hubs;

namespace SMTools.Retro.Services;

public interface IRetroRoomService
{
    Task<RetroRoomResponse> CreateRoomAsync(
        CreateRetroRoomRequest request,
        ClaimsPrincipal user,
        CancellationToken ct);

    Task<List<MyRoomResponse>> GetMyRoomsAsync(
        Guid userId,
        CancellationToken ct);

    Task<List<RetroTemplateResponse>> GetTemplatesAsync(CancellationToken ct);

    Task<LeaveRoomResult> LeaveRoomAsync(
        Guid roomId,
        Guid userId,
        CancellationToken ct);

    Task DeleteRoomAsync(
        Guid roomId,
        Guid userId,
        CancellationToken ct);

    Task<RetroRoomStateDto> GetRoomStateAsync(
        Guid roomId,
        Guid ownParticipantId,
        CancellationToken ct);

    Task<RetroRoomStateDto> GetResultsAsync(
        Guid roomId,
        Guid userId,
        CancellationToken ct);

    Task<RetroRoomStateDto> SetPhaseAsync(
        Guid roomId,
        int phase,
        Guid callerParticipantId,
        CancellationToken ct);
}
