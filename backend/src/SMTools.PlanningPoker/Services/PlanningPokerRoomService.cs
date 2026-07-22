using SMTools.Abstractions;
using SMTools.Abstractions.Dtos;
using SMTools.Abstractions.Endpoints;
using SMTools.Abstractions.Exceptions;
using SMTools.Abstractions.Hubs;
using SMTools.Abstractions.Services;
using SMTools.Abstractions.ValueObjects;
using SMTools.PlanningPoker.Data;
using SMTools.PlanningPoker.DTOs.Apis;
using SMTools.PlanningPoker.DTOs.Hubs;
using SMTools.PlanningPoker.Models;

namespace SMTools.PlanningPoker.Services;

public sealed class PlanningPokerRoomService
    : RoomServiceBase<PlanningPokerRoom, PlanningPokerRoomParticipant, IPlanningPokerRepository>,
      IPlanningPokerRoomService,
      IRoomEndpointHandler<CreatePlanningPokerRoomRequest, PlanningPokerRoomResponse, MyRoomResponse, RoomStateDto>
{
    private readonly IRoomVersionStore _roomVersionStore;
    private readonly IStateBuilder<RoomStateDto> _stateBuilder;

    public PlanningPokerRoomService(IPlanningPokerRepository repo, IUnitOfWork<PlanningPokerDbContext> uow,
        IRoomVersionStore roomVersionStore, IStateBuilder<RoomStateDto> stateBuilder,
        IRoomClosedNotifier notifier)
        : base(repo, uow, notifier)
    {
        _roomVersionStore = roomVersionStore;
        _stateBuilder = stateBuilder;
    }

    protected override PlanningPokerRoom CreateRoomEntity(Guid id, string title, DateTimeOffset createdAt, Password? password, Guid? deckId = null)
        => new()
        {
            Id = id,
            Title = title,
            CreatedAt = createdAt,
            RoomPassword = password,
            DeckId = deckId!.Value,
        };

    protected override PlanningPokerRoomParticipant CreateParticipantEntity(PlanningPokerRoom room, Guid participantId, Guid userId, string displayName)
        => new()
        {
            Id = participantId,
            RoomId = room.Id,
            ConnectionId = string.Empty,
            DisplayName = displayName,
            UserId = userId,
            IsOwner = true,
            IsConnected = false,
            JoinedAt = DateTimeOffset.UtcNow,
        };

    public async Task<PlanningPokerRoomResponse> CreateRoomAsync(
        CreatePlanningPokerRoomRequest request,
        System.Security.Claims.ClaimsPrincipal user,
        CancellationToken ct)
    {
        var deckId = request.DeckId ?? await Repository.GetDefaultDeckIdAsync(ct);

        return await CreateRoomCoreAsync(request.Title, request.Password, user, ct,
            room => new PlanningPokerRoomResponse(room.Id, room.Title, room.CreatedAt, room.DeckId, room.PasswordHash is not null),
            deckId);
    }

    public async Task<List<MyRoomResponse>> GetMyRoomsAsync(Guid userId, CancellationToken ct)
    {
        return await Repository.GetMyRoomsAsync(userId, ct);
    }

    public override async Task<LeaveRoomResult> LeaveRoomAsync(Guid roomId, Guid userId, CancellationToken ct)
    {
        var result = await base.LeaveRoomAsync(roomId, userId, ct);

        if (result.RoomClosed)
        {
            _roomVersionStore.Clear(roomId);
        }

        return result;
    }

    public override async Task DeleteRoomAsync(Guid roomId, Guid userId, CancellationToken ct)
    {
        await base.DeleteRoomAsync(roomId, userId, ct);

        _roomVersionStore.Clear(roomId);
    }

    public async Task<RoomStateDto> GetRoomStateAsync(Guid roomId, Guid ownParticipantId, CancellationToken ct)
    {
        return await _stateBuilder.BuildStateAsync(roomId, ownParticipantId, ct);
    }

    public async Task<RoomStateDto> GetResultsAsync(Guid roomId, Guid userId, CancellationToken ct)
    {
        return await GetResultsCoreAsync(roomId, userId, ct, GetRoomStateAsync);
    }
}
