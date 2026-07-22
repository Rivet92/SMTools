using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SMTools.Abstractions;
using SMTools.Abstractions.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SMTools.PlanningPoker.Data;
using SMTools.PlanningPoker.DTOs.Hubs;
using SMTools.PlanningPoker.Models;
using SMTools.PlanningPoker.Services;

namespace SMTools.PlanningPoker.Hubs;

[Authorize]
public sealed partial class PlanningPokerHub : RoomHubBase<PlanningPokerRoom, PlanningPokerRoomParticipant, RoomStateDto, PlanningPokerDbContext>
{
    private readonly IPlanningPokerRoomService _roomService;
    private readonly IPlanningPokerVoteItemService _voteItemService;

    public PlanningPokerHub(PlanningPokerDbContext db, IUnitOfWork<PlanningPokerDbContext> uow,
        IConfiguration configuration,
        IPlanningPokerRoomService roomService, IPlanningPokerVoteItemService voteItemService,
        IRoomVersionStore roomVersionStore,
        ILogger<PlanningPokerHub> logger)
        : base(db, uow, configuration, logger, roomVersionStore)
    {
        _roomService = roomService;
        _voteItemService = voteItemService;
    }

    protected override async Task<RoomStateDto> BuildRoomStateAsync(Guid roomId, Guid ownParticipantId, CancellationToken cancellationToken)
    {
        return await _roomService.GetRoomStateAsync(roomId, ownParticipantId, cancellationToken);
    }

    protected override async Task OnParticipantRemovedAsync(Guid roomId, Guid participantId, CancellationToken cancellationToken)
    {
        await Db.PlanningPokerVotes
            .Where(v => v.RoomId == roomId && v.ParticipantId == participantId)
            .ExecuteUpdateAsync(s => s.SetProperty(v => v.DeletedAt, DateTimeOffset.UtcNow), cancellationToken);
    }
}
