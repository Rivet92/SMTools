using SMTools.Abstractions;
using SMTools.Abstractions.Exceptions;
using SMTools.PlanningPoker.Data;
using SMTools.PlanningPoker.DTOs;
using SMTools.PlanningPoker.DTOs.Hubs;
using SMTools.PlanningPoker.Models;

namespace SMTools.PlanningPoker.Services;

public sealed class PlanningPokerStateBuilder : IStateBuilder<RoomStateDto>
{
    private readonly IPlanningPokerRepository _repo;

    public PlanningPokerStateBuilder(IPlanningPokerRepository repo)
    {
        _repo = repo;
    }

    public async Task<RoomStateDto> BuildStateAsync(Guid roomId, Guid ownParticipantId, CancellationToken ct)
    {
        var room = await _repo.GetFullRoomStateAsync(roomId, ct);

        if (room is null)
            throw new NotFoundException<PlanningPokerRoom>(roomId);

        var participants = room.Participants.ProjectToParticipantDto();
        var voteItems = room.VoteItems.ProjectToVoteItemDto(ownParticipantId);

        return new RoomStateDto(
            room.Id,
            room.Title,
            room.CreatedAt,
            participants,
            voteItems,
            ownParticipantId,
            room.DeckId,
            room.PasswordHash is not null);
    }
}
