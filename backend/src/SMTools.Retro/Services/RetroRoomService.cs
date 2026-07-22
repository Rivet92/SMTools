using SMTools.Abstractions;
using SMTools.Abstractions.Dtos;
using SMTools.Abstractions.Endpoints;
using SMTools.Abstractions.Exceptions;
using SMTools.Abstractions.Services;
using SMTools.Abstractions.ValueObjects;
using SMTools.Retro.Data;
using SMTools.Retro.DTOs.Apis;
using SMTools.Retro.DTOs.Hubs;
using SMTools.Retro.Models;

namespace SMTools.Retro.Services;

public sealed class RetroRoomService
    : RoomServiceBase<RetroRoom, RetroRoomParticipant, IRetroRepository>,
      IRetroRoomService,
      IRoomEndpointHandler<CreateRetroRoomRequest, RetroRoomResponse, MyRoomResponse, RetroRoomStateDto>
{
    private readonly IStateBuilder<RetroRoomStateDto> _stateBuilder;

    public RetroRoomService(IRetroRepository repo, IStateBuilder<RetroRoomStateDto> stateBuilder,
        IUnitOfWork<RetroDbContext> uow, IRoomClosedNotifier notifier)
        : base(repo, uow, notifier)
    {
        _stateBuilder = stateBuilder;
    }

    protected override RetroRoom CreateRoomEntity(Guid id, string title, DateTimeOffset createdAt, Password? password, Guid? deckId = null)
        => new()
        {
            Id = id,
            Title = title,
            CreatedAt = createdAt,
            RoomPassword = password,
            TemplateId = deckId!.Value,
        };

    protected override RetroRoomParticipant CreateParticipantEntity(RetroRoom room, Guid participantId, Guid userId, string displayName)
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

    public async Task<RetroRoomResponse> CreateRoomAsync(
        CreateRetroRoomRequest request,
        System.Security.Claims.ClaimsPrincipal user,
        CancellationToken ct)
    {
        var templateId = request.TemplateId ?? await Repository.GetDefaultTemplateIdAsync(ct);

        return await CreateRoomCoreAsync(request.Title, request.Password, user, ct,
            room => new RetroRoomResponse(room.Id, room.Title, room.CreatedAt, room.TemplateId, room.PasswordHash is not null),
            templateId);
    }

    public async Task<List<MyRoomResponse>> GetMyRoomsAsync(Guid userId, CancellationToken ct)
    {
        return await Repository.GetMyRoomsAsync(userId, ct);
    }

    public async Task<List<RetroTemplateResponse>> GetTemplatesAsync(CancellationToken ct)
    {
        return await Repository.GetTemplatesAsync(ct);
    }

    public async Task<RetroRoomStateDto> GetRoomStateAsync(Guid roomId, Guid ownParticipantId, CancellationToken ct)
    {
        return await _stateBuilder.BuildStateAsync(roomId, ownParticipantId, ct);
    }

    public async Task<RetroRoomStateDto> GetResultsAsync(Guid roomId, Guid userId, CancellationToken ct)
    {
        return await GetResultsCoreAsync(roomId, userId, ct, GetRoomStateAsync);
    }

    public async Task<RetroRoomStateDto> SetPhaseAsync(
        Guid roomId, int phase, Guid callerParticipantId, CancellationToken ct)
    {
        var room = await Repository.GetRoomAsync(roomId, ct);

        if (room is null)
            throw new NotFoundException<RetroRoom>(roomId);

        if (!Enum.IsDefined(typeof(RetroPhase), phase))
            throw new BusinessRuleException("Invalid phase.");

        room.TransitionTo((RetroPhase)phase);
        await UnitOfWork.SaveChangesAsync(ct);

        return await GetRoomStateAsync(roomId, callerParticipantId, ct);
    }
}
