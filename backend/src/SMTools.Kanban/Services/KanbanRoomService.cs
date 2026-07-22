using SMTools.Abstractions;
using SMTools.Abstractions.Dtos;
using SMTools.Abstractions.Endpoints;
using SMTools.Abstractions.Exceptions;
using SMTools.Abstractions.Services;
using SMTools.Abstractions.ValueObjects;
using SMTools.Kanban.Data;
using SMTools.Kanban.DTOs.Apis;
using SMTools.Kanban.DTOs.Hubs;
using SMTools.Kanban.Models;

namespace SMTools.Kanban.Services;

public sealed class KanbanRoomService
    : RoomServiceBase<KanbanRoom, KanbanRoomParticipant, IKanbanRepository>,
      IKanbanRoomService,
      IRoomEndpointHandler<CreateKanbanRoomRequest, KanbanRoomResponse, MyRoomResponse, KanbanRoomStateDto>
{
    private readonly IStateBuilder<KanbanRoomStateDto> _stateBuilder;

    public KanbanRoomService(IKanbanRepository repo, IStateBuilder<KanbanRoomStateDto> stateBuilder,
        IUnitOfWork<KanbanDbContext> uow, IRoomClosedNotifier notifier)
        : base(repo, uow, notifier)
    {
        _stateBuilder = stateBuilder;
    }

    protected override KanbanRoom CreateRoomEntity(Guid id, string title, DateTimeOffset createdAt, Password? password, Guid? deckId = null)
        => new()
        {
            Id = id,
            Title = title,
            CreatedAt = createdAt,
            RoomPassword = password,
        };

    protected override KanbanRoomParticipant CreateParticipantEntity(KanbanRoom room, Guid participantId, Guid userId, string displayName)
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

    public async Task<KanbanRoomResponse> CreateRoomAsync(
        CreateKanbanRoomRequest request,
        System.Security.Claims.ClaimsPrincipal user,
        CancellationToken ct)
    {
        return await CreateRoomCoreAsync(request.Title, request.Password, user, ct,
            room => new KanbanRoomResponse(room.Id, room.Title, room.CreatedAt, room.PasswordHash is not null));
    }

    public async Task<List<MyRoomResponse>> GetMyRoomsAsync(Guid userId, CancellationToken ct)
    {
        return await Repository.GetMyRoomsAsync(userId, ct);
    }

    public async Task<KanbanRoomStateDto> GetRoomStateAsync(Guid roomId, Guid ownParticipantId, CancellationToken ct)
    {
        return await _stateBuilder.BuildStateAsync(roomId, ownParticipantId, ct);
    }

    public async Task<KanbanRoomStateDto> GetResultsAsync(Guid roomId, Guid userId, CancellationToken ct)
    {
        return await GetResultsCoreAsync(roomId, userId, ct, GetRoomStateAsync);
    }
}
