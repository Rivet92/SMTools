using SMTools.Abstractions;
using SMTools.Abstractions.Exceptions;
using SMTools.Retro.Data;
using SMTools.Retro.DTOs;
using SMTools.Retro.DTOs.Hubs;
using SMTools.Retro.Models;

namespace SMTools.Retro.Services;

public sealed class RetroStateBuilder : IStateBuilder<RetroRoomStateDto>
{
    private readonly IRetroRepository _repo;

    public RetroStateBuilder(IRetroRepository repo)
    {
        _repo = repo;
    }

    public async Task<RetroRoomStateDto> BuildStateAsync(Guid roomId, Guid ownParticipantId, CancellationToken ct)
    {
        var room = await _repo.GetFullRoomStateAsync(roomId, ct);

        if (room is null)
            throw new NotFoundException<RetroRoom>(roomId);

        var participants = room.Participants
            .Where(p => !p.HasLeft)
            .ProjectToParticipantDto();

        var columns = room.Template.Columns
            .ProjectToColumnDto();

        var allVotes = room.Cards.SelectMany(c => c.Votes).Where(v => v.DeletedAt == null).ToList();

        var voteCountByCard = allVotes
            .GroupBy(v => v.CardId)
            .ToDictionary(g => g.Key, g => g.Sum(v => v.Points));

        var ownVotePointsByCard = allVotes
            .Where(v => v.ParticipantId == ownParticipantId)
            .GroupBy(v => v.CardId)
            .ToDictionary(g => g.Key, g => g.Sum(v => v.Points));

        var cardDtos = room.Cards
            .Where(c => c.DeletedAt == null)
            .OrderBy(c => c.CreatedAt)
            .Select(c =>
            {
                var voteCount = voteCountByCard.TryGetValue(c.Id, out var vc) ? vc : 0;
                var ownVotePoints = ownVotePointsByCard.TryGetValue(c.Id, out var ov) ? ov : 0;
                return new RetroCardDto(
                    c.Id, c.ColumnId, c.GroupId, c.Content,
                    c.AuthorParticipantId, c.CreatedAt,
                    voteCount, ownVotePoints
                );
            })
            .ToList();

        var groupDtos = room.Groups
            .OrderBy(g => g.CreatedAt)
            .Select(g => new RetroCardGroupDto(
                g.Id, g.Title, g.CreatedAt,
                room.Cards.Where(c => c.GroupId == g.Id).Select(c => c.Id).ToList()
            ))
            .ToList();

        var actionItemDtos = room.ActionItems
            .OrderBy(a => a.CreatedAt)
            .Select(a => new RetroActionItemDto(a.Id, a.Content, a.AssigneeParticipantId, a.CreatedAt))
            .ToList();

        return new RetroRoomStateDto(
            room.Id, room.Title, room.CreatedAt,
            room.Phase.ToString(), room.TemplateId,
            participants, columns, cardDtos, groupDtos, actionItemDtos,
            ownParticipantId, room.PasswordHash is not null
        );
    }
}
