using System.Security.Claims;
using SMTools.Abstractions.Exceptions;
using SMTools.Abstractions.ValueObjects;

namespace SMTools.Abstractions.Services;

public abstract class RoomServiceBase<TRoom, TParticipant, TRepository>
    where TRoom : class, IRoom
    where TParticipant : class, IRoomParticipant
    where TRepository : IRoomRepository<TRoom, TParticipant>
{
    protected readonly TRepository Repository;
    protected readonly IUnitOfWork UnitOfWork;
    private readonly IRoomClosedNotifier _notifier;

    protected RoomServiceBase(TRepository repository, IUnitOfWork unitOfWork, IRoomClosedNotifier? notifier = null)
    {
        Repository = repository;
        UnitOfWork = unitOfWork;
        _notifier = notifier ?? NullRoomClosedNotifier.Instance;
    }

    // Virtual: repository operations (default delegates to repository)
    public virtual Task AddRoomAsync(TRoom room, CancellationToken ct)
        => Repository.AddRoomAsync(room, ct);

    public virtual Task AddParticipantAsync(TParticipant participant, CancellationToken ct)
        => Repository.AddParticipantAsync(participant, ct);

    public virtual Task<TParticipant?> GetParticipantByUserAsync(Guid roomId, Guid userId, CancellationToken ct)
        => Repository.GetParticipantByUserAsync(roomId, userId, ct);

    public virtual Task<bool> HasParticipantsAsync(Guid roomId, CancellationToken ct)
        => Repository.HasParticipantsAsync(roomId, ct);

    public virtual Task DeleteRoomByIdAsync(Guid roomId, CancellationToken ct)
        => Repository.DeleteRoomAsync(roomId, ct);

    public virtual Task<bool> IsRoomOwnerAsync(Guid roomId, Guid userId, CancellationToken ct)
        => Repository.IsRoomOwnerAsync(roomId, userId, ct);

    public virtual Task<TRoom?> GetRoomAsync(Guid roomId, CancellationToken ct)
        => Repository.GetRoomAsync(roomId, ct);

    // Abstract: entity creation (differs per module)
    protected abstract TRoom CreateRoomEntity(Guid id, string title, DateTimeOffset createdAt, Password? password, Guid? deckId = null);
    protected abstract TParticipant CreateParticipantEntity(TRoom room, Guid participantId, Guid userId, string displayName);

    protected async Task<TResponse> CreateRoomCoreAsync<TResponse>(
        string title,
        string? password,
        ClaimsPrincipal user,
        CancellationToken ct,
        Func<TRoom, TResponse> mapToResponse,
        Guid? deckId = null)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new BusinessRuleException("Title is required.");

        var userId = ClaimsHelper.TryGetUserId(user)
            ?? throw new UnauthorizedAccessException("User must be authenticated.");
        var displayName = ClaimsHelper.GetDisplayName(user);
        var passwordObj = password is not null ? Password.Create(password) : null;

        await using var tx = await UnitOfWork.BeginTransactionAsync(ct);

        var room = CreateRoomEntity(Guid.NewGuid(), title.Trim(), DateTimeOffset.UtcNow, passwordObj, deckId);
        await AddRoomAsync(room, ct);

        var participant = CreateParticipantEntity(room, Guid.NewGuid(), userId, displayName);
        await AddParticipantAsync(participant, ct);
        await UnitOfWork.SaveChangesAsync(ct);

        await tx.CommitAsync(ct);

        return mapToResponse(room);
    }

    public virtual async Task<LeaveRoomResult> LeaveRoomAsync(Guid roomId, Guid userId, CancellationToken ct)
    {
        var participant = await GetParticipantByUserAsync(roomId, userId, ct);

        if (participant is null)
            throw new NotFoundException<TParticipant>(userId);

        participant.HasLeft = true;

        var anyRemaining = await HasParticipantsAsync(roomId, ct);

        if (!anyRemaining)
        {
            await DeleteRoomByIdAsync(roomId, ct);
        }

        await UnitOfWork.SaveChangesAsync(ct);

        if (!anyRemaining)
        {
            await _notifier.NotifyRoomClosedAsync(roomId, "The room has been closed because all participants left.", ct);
        }

        return new LeaveRoomResult(!anyRemaining);
    }

    public virtual async Task DeleteRoomAsync(Guid roomId, Guid userId, CancellationToken ct)
    {
        var isOwner = await IsRoomOwnerAsync(roomId, userId, ct);

        if (!isOwner)
            throw new ForbiddenException("Only the room owner can delete the room.");

        var room = await GetRoomAsync(roomId, ct);
        if (room is null)
            throw new NotFoundException<TRoom>(roomId);

        await DeleteRoomByIdAsync(roomId, ct);
        await UnitOfWork.SaveChangesAsync(ct);

        await _notifier.NotifyRoomClosedAsync(roomId, "The room has been deleted by the owner.", ct);
    }

    protected async Task<TState> GetResultsCoreAsync<TState>(
        Guid roomId,
        Guid userId,
        CancellationToken ct,
        Func<Guid, Guid, CancellationToken, Task<TState>> getRoomState)
    {
        var (room, participant) = await GetRoomAndParticipantAsync(roomId, userId, ct);

        if (room is null)
            throw new NotFoundException<TRoom>(roomId);

        if (participant is null)
            throw new NotFoundException<TParticipant>(userId);

        return await getRoomState(roomId, participant.Id, ct);
    }

    protected virtual async Task<(TRoom? Room, TParticipant? Participant)> GetRoomAndParticipantAsync(
        Guid roomId, Guid userId, CancellationToken ct)
    {
        var room = await GetRoomAsync(roomId, ct);

        if (room is null)
            return (null, null);

        var participant = await GetParticipantByUserAsync(roomId, userId, ct);

        return (room, participant);
    }
}
