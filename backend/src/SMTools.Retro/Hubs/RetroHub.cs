using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SMTools.Abstractions;
using SMTools.Abstractions.Hubs;
using SMTools.Retro.Data;
using SMTools.Retro.DTOs.Hubs;
using SMTools.Retro.Models;
using SMTools.Retro.Services;

namespace SMTools.Retro.Hubs;

[Authorize]
public sealed partial class RetroHub : RoomHubBase<RetroRoom, RetroRoomParticipant, RetroRoomStateDto, RetroDbContext>
{
    private readonly IRetroRoomService _roomService;
    private readonly IRetroCardService _cardService;
    private readonly IRetroVoteService _voteService;
    private readonly IRetroActionItemService _actionItemService;

    public RetroHub(
        RetroDbContext db,
        IUnitOfWork<RetroDbContext> uow,
        IConfiguration configuration,
        IRetroRoomService roomService,
        IRetroCardService cardService,
        IRetroVoteService voteService,
        IRetroActionItemService actionItemService,
        IRoomVersionStore roomVersionStore,
        ILogger<RetroHub> logger)
        : base(db, uow, configuration, logger, roomVersionStore)
    {
        _roomService = roomService;
        _cardService = cardService;
        _voteService = voteService;
        _actionItemService = actionItemService;
    }

    protected override async Task<RetroRoomStateDto> BuildRoomStateAsync(Guid roomId, Guid ownParticipantId, CancellationToken cancellationToken)
    {
        return await _roomService.GetRoomStateAsync(roomId, ownParticipantId, cancellationToken);
    }

    protected override async Task OnParticipantRemovedAsync(Guid roomId, Guid participantId, CancellationToken cancellationToken)
    {
        await Db.RetroCards
            .Where(c => c.RoomId == roomId && c.AuthorParticipantId == participantId)
            .ExecuteUpdateAsync(s => s.SetProperty(c => c.DeletedAt, DateTimeOffset.UtcNow), cancellationToken);

        await Db.RetroVotes
            .Where(v => v.RoomId == roomId && v.ParticipantId == participantId)
            .ExecuteUpdateAsync(s => s.SetProperty(v => v.DeletedAt, DateTimeOffset.UtcNow), cancellationToken);
    }

    public async Task<RetroRoomStateDto> SetPhase(Guid roomId, int phase)
    {
        var ct = Context.ConnectionAborted;
        var caller = await EnsureOwnerOrAdmin(roomId, ct);

        return await ExecuteAndBroadcastAsync(roomId, async (id, token) =>
            await _roomService.SetPhaseAsync(id, phase, caller.Id, token), ct);
    }

}
