using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SMTools.Abstractions;
using SMTools.Abstractions.Exceptions;
using SMTools.Abstractions.ValueObjects;

namespace SMTools.Abstractions.Hubs;

[Authorize]
public abstract class RoomHubBase<TRoom, TParticipant, TState, TDbContext> : Hub
    where TRoom : class, IRoom
    where TParticipant : class, IRoomParticipant
    where TState : IVersionedState
    where TDbContext : DbContext
{
    protected TDbContext Db { get; }
    protected IUnitOfWork<TDbContext> Uow { get; }
    private readonly ILogger _logger;
    private readonly TimeSpan _reconnectTimeout;
    protected readonly IRoomVersionStore? _versionStore;

    protected RoomHubBase(TDbContext db, IUnitOfWork<TDbContext> uow, IConfiguration configuration, ILogger logger, IRoomVersionStore? versionStore = null)
    {
        Db = db;
        Uow = uow;
        _logger = logger;
        _reconnectTimeout = TimeSpan.FromSeconds(
            configuration.GetValue<double>("SignalR:ReconnectTimeoutSeconds", 10));
        _versionStore = versionStore;
    }

    protected DbSet<TRoom> Rooms => Db.Set<TRoom>();
    protected DbSet<TParticipant> Participants => Db.Set<TParticipant>();

    public async Task<TState> JoinRoom(Guid roomId, string? password)
    {
        var cancellationToken = Context.ConnectionAborted;
        var room = await Rooms.FindAsync([roomId], cancellationToken);
        if (room is null)
        {
            _logger.LogWarning("JoinRoom failed: room {RoomId} not found (Connection: {ConnectionId})",
                roomId, Context.ConnectionId);
            throw new BusinessRuleException("RoomNotActive", $"Room {roomId} not found.");
        }

        var userId = GetUserId();
        if (userId is not null)
        {
            var existingParticipant = await Participants
                .FirstOrDefaultAsync(p => p.RoomId == roomId && p.UserId == userId.Value, cancellationToken);

            if (existingParticipant is not null)
                return await ReconnectParticipantAsync(existingParticipant, roomId, cancellationToken);
        }

        if (room.PasswordHash is not null)
        {
            if (password is null || !Password.Verify(room.PasswordHash, password))
            {
                _logger.LogWarning("JoinRoom failed: invalid password for room {RoomId} (Connection: {ConnectionId})",
                    roomId, Context.ConnectionId);
                throw new InvalidPasswordException();
            }
        }

        var hasParticipants = await Participants.AnyAsync(p => p.RoomId == roomId, cancellationToken);
        var participant = CreateParticipant(roomId, isOwner: !hasParticipants, GetDisplayName(), GetUserId());
        Participants.Add(participant);

        await using var tx = await Uow.BeginTransactionAsync(cancellationToken);
        await Uow.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);

        await Groups.AddToGroupAsync(Context.ConnectionId, roomId.ToString(), cancellationToken);

        return await BuildAndBroadcastStateAsync(roomId, participant.Id, excludeCaller: true, ct: cancellationToken);
    }

    public async Task<TState> LeaveRoom(Guid roomId)
    {
        var cancellationToken = Context.ConnectionAborted;
        var participant = await Participants
            .FirstOrDefaultAsync(p => p.RoomId == roomId && p.ConnectionId == Context.ConnectionId, cancellationToken);

        if (participant is not null)
            await HandleParticipantDisconnect(participant, cancellationToken);

        var state = await BuildRoomStateAsync(roomId, Guid.Empty, cancellationToken);
            state = WithVersion(state, NextVersion(roomId));
        return state;
    }

    public async Task<TState> UpdateRoomPassword(Guid roomId, string? password)
    {
        var cancellationToken = Context.ConnectionAborted;
        var caller = await EnsureOwnerOrAdmin(roomId, cancellationToken);
        var room = await EnsureRoomActive(roomId, cancellationToken);

        room.PasswordHash = password is not null ? Password.Create(password).Hash : null;

        await using var tx = await Uow.BeginTransactionAsync(cancellationToken);
        await Uow.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);

        return await BuildAndBroadcastStateAsync(roomId, caller.Id, ct: cancellationToken);
    }

    public async Task<TState> MakeAdmin(Guid roomId, Guid participantId)
    {
        var cancellationToken = Context.ConnectionAborted;
        var caller = await EnsureOwner(roomId, cancellationToken);

        var target = await Participants
            .FirstOrDefaultAsync(p => p.Id == participantId && p.RoomId == roomId, cancellationToken);

        if (target is null)
        {
            _logger.LogWarning("MakeAdmin failed: participant {ParticipantId} not found in room {RoomId} (Connection: {ConnectionId})",
                participantId, roomId, Context.ConnectionId);
            throw new ParticipantNotInRoomException("Participant not found.");
        }

        if (target.IsOwner)
            throw new BusinessRuleException("Cannot change the owner's role.");

        target.IsAdmin = true;
        await Uow.SaveChangesAsync(cancellationToken);

        return await BuildAndBroadcastStateAsync(roomId, caller.Id, ct: cancellationToken);
    }

    public async Task<TState> RemoveAdmin(Guid roomId, Guid participantId)
    {
        var cancellationToken = Context.ConnectionAborted;
        var caller = await EnsureOwner(roomId, cancellationToken);

        var target = await Participants
            .FirstOrDefaultAsync(p => p.Id == participantId && p.RoomId == roomId, cancellationToken);

        if (target is null)
        {
            _logger.LogWarning("RemoveAdmin failed: participant {ParticipantId} not found in room {RoomId} (Connection: {ConnectionId})",
                participantId, roomId, Context.ConnectionId);
            throw new ParticipantNotInRoomException("Participant not found.");
        }

        if (target.IsOwner)
            throw new BusinessRuleException("Cannot change the owner's role.");

        target.IsAdmin = false;
        await Uow.SaveChangesAsync(cancellationToken);

        return await BuildAndBroadcastStateAsync(roomId, caller.Id, ct: cancellationToken);
    }

    public async Task<TState> RemoveParticipant(Guid roomId, Guid participantId)
    {
        var cancellationToken = Context.ConnectionAborted;
        var caller = await EnsureOwnerOrAdmin(roomId, cancellationToken);

        var target = await Participants
            .FirstOrDefaultAsync(p => p.Id == participantId && p.RoomId == roomId, cancellationToken);

        if (target is null)
        {
            _logger.LogWarning("RemoveParticipant failed: participant {ParticipantId} not found in room {RoomId} (Connection: {ConnectionId})",
                participantId, roomId, Context.ConnectionId);
            throw new ParticipantNotInRoomException("Participant not found.");
        }

        if (target.IsOwner)
            throw new BusinessRuleException("Cannot remove the room owner.");

        if (!caller.IsOwner && target.IsAdmin)
            throw new BusinessRuleException("An admin cannot remove another admin.");

        target.HasLeft = true;
        target.IsConnected = false;

        await OnParticipantRemovedAsync(roomId, target.Id, cancellationToken);

        await Groups.RemoveFromGroupAsync(target.ConnectionId, roomId.ToString(), cancellationToken);
        await Uow.SaveChangesAsync(cancellationToken);

        await Clients.Client(target.ConnectionId).SendAsync("YouWereRemoved", cancellationToken);
        return await BuildAndBroadcastStateAsync(roomId, caller.Id, ct: cancellationToken);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var connectionId = Context.ConnectionId;

        var participant = await Participants
            .FirstOrDefaultAsync(p => p.ConnectionId == connectionId && p.IsConnected);

        if (participant is not null)
        {
            try
            {
                await Task.Delay(_reconnectTimeout, Context.ConnectionAborted);
            }
            catch (TaskCanceledException)
            {
            }

            var stillDisconnected = await Participants
                .FirstOrDefaultAsync(p => p.Id == participant.Id && p.ConnectionId == connectionId);

            if (stillDisconnected is not null)
                await HandleParticipantDisconnect(stillDisconnected, Context.ConnectionAborted);
        }

        await base.OnDisconnectedAsync(exception);
    }

    protected async Task<TState> ReconnectParticipantAsync(TParticipant participant, Guid roomId, CancellationToken cancellationToken)
    {
        participant.ConnectionId = Context.ConnectionId;
        participant.IsConnected = true;
        await Uow.SaveChangesAsync(cancellationToken);

        await Groups.AddToGroupAsync(Context.ConnectionId, roomId.ToString(), cancellationToken);

        return await BuildAndBroadcastStateAsync(roomId, participant.Id, excludeCaller: true, ct: cancellationToken);
    }

    protected async Task<TParticipant> EnsureOwner(Guid roomId, CancellationToken cancellationToken)
    {
        var participant = await EnsureParticipant(roomId, cancellationToken);
        if (!participant.IsOwner)
        {
            _logger.LogWarning("EnsureOwner failed: caller is not owner in room {RoomId} (Connection: {ConnectionId})",
                roomId, Context.ConnectionId);
            throw new ForbiddenException("Only the room owner can perform this action.");
        }
        return participant;
    }

    protected async Task<TParticipant> EnsureOwnerOrAdmin(Guid roomId, CancellationToken cancellationToken)
    {
        var participant = await EnsureParticipant(roomId, cancellationToken);
        if (!participant.IsOwner && !participant.IsAdmin)
        {
            _logger.LogWarning("EnsureOwnerOrAdmin failed: caller is not owner/admin in room {RoomId} (Connection: {ConnectionId})",
                roomId, Context.ConnectionId);
            throw new ForbiddenException("Only the room owner or an admin can perform this action.");
        }
        return participant;
    }

    protected async Task<TParticipant> EnsureParticipant(Guid roomId, CancellationToken cancellationToken)
    {
        var participant = await Participants
            .FirstOrDefaultAsync(p => p.RoomId == roomId && p.ConnectionId == Context.ConnectionId && p.IsConnected, cancellationToken);

        if (participant is null)
        {
            _logger.LogWarning("EnsureParticipant failed: caller not a participant in room {RoomId} (Connection: {ConnectionId})",
                roomId, Context.ConnectionId);
            throw new ForbiddenException("You are not a participant in this room.");
        }

        return participant;
    }

    protected async Task<TRoom> EnsureRoomActive(Guid roomId, CancellationToken cancellationToken)
    {
        var room = await Rooms.FindAsync([roomId], cancellationToken);
        if (room is null)
        {
            _logger.LogWarning("EnsureRoomActive failed: room {RoomId} not found (Connection: {ConnectionId})",
                roomId, Context.ConnectionId);
            throw new BusinessRuleException("RoomNotActive", $"Room {roomId} not found.");
        }
        return room;
    }

    protected virtual TParticipant CreateParticipant(Guid roomId, bool isOwner, string displayName, Guid? userId)
    {
        var participant = Activator.CreateInstance<TParticipant>();
        participant.Id = Guid.NewGuid();
        participant.RoomId = roomId;
        participant.ConnectionId = Context.ConnectionId;
        participant.DisplayName = displayName;
        participant.UserId = userId;
        participant.IsOwner = isOwner;
        participant.IsConnected = true;
        participant.JoinedAt = DateTimeOffset.UtcNow;
        return participant;
    }

    public virtual async Task<TState> GetFullState(Guid roomId)
    {
        var ct = Context.ConnectionAborted;
        var participant = await EnsureParticipant(roomId, ct);
        var state = await BuildRoomStateAsync(roomId, participant.Id, ct);
        var version = _versionStore!.GetCurrentVersion(roomId);
        return WithVersion(state, version);
    }

    protected abstract Task<TState> BuildRoomStateAsync(Guid roomId, Guid ownParticipantId, CancellationToken cancellationToken);

    protected virtual TState WithVersion(TState state, int version)
    {
        state.Version = version;
        return state;
    }

    protected int NextVersion(Guid roomId) =>
        _versionStore?.NextVersion(roomId) ?? 0;

    protected virtual void OnRoomClosed(Guid roomId)
    {
        _versionStore?.Clear(roomId);
    }

    protected virtual Task OnParticipantRemovedAsync(Guid roomId, Guid participantId, CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }

    protected async Task<TState> ExecuteAndBroadcastAsync(
        Guid roomId,
        Func<Guid, CancellationToken, Task<TState>> action,
        CancellationToken ct)
    {
        var state = await action(roomId, ct);
        var version = NextVersion(roomId);
        state = WithVersion(state, version);
        await Clients.Group(roomId.ToString()).SendAsync("RoomUpdated", state, ct);
        return state;
    }

    protected async Task<TState> BroadcastStateAsync(Guid roomId, Guid ownParticipantId, CancellationToken cancellationToken)
    {
        var state = await BuildRoomStateAsync(roomId, ownParticipantId, cancellationToken);
        await Clients.Group(roomId.ToString()).SendAsync("RoomUpdated", state, cancellationToken);
        return state;
    }

    private async Task<TState> BuildAndBroadcastStateAsync(
        Guid roomId,
        Guid participantId,
        string? group = null,
        bool excludeCaller = false,
        CancellationToken ct = default)
    {
        var state = await BuildRoomStateAsync(roomId, participantId, ct);
        state = WithVersion(state, NextVersion(roomId));
        var groupName = group ?? roomId.ToString();
        if (excludeCaller)
            await Clients.OthersInGroup(groupName).SendAsync("RoomUpdated", state, ct);
        else
            await Clients.Group(groupName).SendAsync("RoomUpdated", state, ct);
        return state;
    }

    private async Task HandleParticipantDisconnect(TParticipant participant, CancellationToken cancellationToken)
    {
        participant.IsConnected = false;
        await Uow.SaveChangesAsync(cancellationToken);

        var hasConnectedParticipants = await Participants
            .AnyAsync(p => p.RoomId == participant.RoomId && p.IsConnected, cancellationToken);

        if (!hasConnectedParticipants)
            OnRoomClosed(participant.RoomId);

        await Groups.RemoveFromGroupAsync(participant.ConnectionId, participant.RoomId.ToString(), cancellationToken);

        await BuildAndBroadcastStateAsync(participant.RoomId, participant.Id, ct: cancellationToken);
    }

    private string GetDisplayName() => ClaimsHelper.GetDisplayName(Context.GetHttpContext()?.User);

    private Guid? GetUserId() => ClaimsHelper.TryGetUserId(Context.GetHttpContext()?.User);
}
