using SMTools.Abstractions;
using SMTools.Abstractions.Dtos;
using SMTools.Abstractions.Exceptions;
using SMTools.Kanban.Data;
using SMTools.Kanban.DTOs.Hubs;
using SMTools.Kanban.Models;

namespace SMTools.Kanban.Services;

public sealed class KanbanStateBuilder : IStateBuilder<KanbanRoomStateDto>
{
    private readonly IKanbanRepository _repo;

    public KanbanStateBuilder(IKanbanRepository repo)
    {
        _repo = repo;
    }

    public async Task<KanbanRoomStateDto> BuildStateAsync(Guid roomId, Guid ownParticipantId, CancellationToken ct)
    {
        var room = await _repo.GetFullRoomStateAsync(roomId, ct);

        if (room is null)
            throw new NotFoundException<KanbanRoom>(roomId);

        var participants = room.Participants
            .Where(p => !p.HasLeft)
            .OrderBy(p => p.JoinedAt)
            .Select(p => new ParticipantDto(p.Id, p.DisplayName, p.IsOwner, p.IsAdmin, p.IsConnected))
            .ToList();

        var columns = room.Columns
            .Select(c => new KanbanColumnDto(c.Id, c.Title, c.Description, c.DisplayOrder))
            .ToList();

        var cardDtos = room.Cards
            .Where(c => c.DeletedAt == null)
            .OrderBy(c => c.ColumnId)
            .ThenBy(c => c.DisplayOrder)
            .Select(c => new KanbanCardDto(
                c.Id, c.ColumnId, c.Title, c.Description,
                c.AuthorParticipantId, c.AssignedParticipantId,
                c.DisplayOrder, c.CreatedAt,
                c.RepoUrl, c.RepoBranch,
                c.InitialEstimation, c.Remaining, c.DueAt,
                c.Comments.Where(co => co.DeletedAt == null).OrderBy(co => co.CreatedAt).Select(co => new KanbanCardCommentDto(
                    co.Id, co.CardId, co.AuthorParticipantId, co.Content, co.CreatedAt, co.UpdatedAt
                )).ToList()))
            .ToList();

        return new KanbanRoomStateDto(
            room.Id, room.Title, room.CreatedAt,
            participants, columns, cardDtos,
            ownParticipantId, room.PasswordHash is not null);
    }
}
