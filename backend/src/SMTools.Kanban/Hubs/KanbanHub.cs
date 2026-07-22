using Microsoft.Extensions.Logging;
using SMTools.Abstractions;
using SMTools.Abstractions.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SMTools.Kanban.Data;
using SMTools.Kanban.DTOs.Hubs;
using SMTools.Kanban.Models;
using SMTools.Kanban.Services;

namespace SMTools.Kanban.Hubs;

[Authorize]
public sealed partial class KanbanHub : RoomHubBase<KanbanRoom, KanbanRoomParticipant, KanbanRoomStateDto, KanbanDbContext>
{
    private readonly IKanbanRoomService _roomService;
    private readonly IKanbanCardService _cardService;
    private readonly IKanbanColumnService _columnService;
    private readonly IKanbanCommentService _commentService;

    public KanbanHub(
        KanbanDbContext db,
        IUnitOfWork<KanbanDbContext> uow,
        IConfiguration configuration,
        IKanbanRoomService roomService,
        IKanbanCardService cardService,
        IKanbanColumnService columnService,
        IKanbanCommentService commentService,
        IRoomVersionStore roomVersionStore,
        ILogger<KanbanHub> logger)
        : base(db, uow, configuration, logger, roomVersionStore)
    {
        _roomService = roomService;
        _cardService = cardService;
        _columnService = columnService;
        _commentService = commentService;
    }

    protected override async Task<KanbanRoomStateDto> BuildRoomStateAsync(Guid roomId, Guid ownParticipantId, CancellationToken cancellationToken)
    {
        return await _roomService.GetRoomStateAsync(roomId, ownParticipantId, cancellationToken);
    }

    protected override async Task OnParticipantRemovedAsync(Guid roomId, Guid participantId, CancellationToken cancellationToken)
    {
        await Db.KanbanCards
            .Where(c => c.RoomId == roomId && c.AuthorParticipantId == participantId)
            .ExecuteUpdateAsync(s => s.SetProperty(c => c.DeletedAt, DateTimeOffset.UtcNow), cancellationToken);

        await Db.KanbanCards
            .Where(c => c.RoomId == roomId && c.AssignedParticipantId == participantId)
            .ExecuteUpdateAsync(s => s.SetProperty(c => c.AssignedParticipantId, (Guid?)null), cancellationToken);

        await Db.KanbanCardComments
            .Where(c => c.AuthorParticipantId == participantId)
            .ExecuteUpdateAsync(s => s.SetProperty(c => c.DeletedAt, DateTimeOffset.UtcNow), cancellationToken);
    }

}
