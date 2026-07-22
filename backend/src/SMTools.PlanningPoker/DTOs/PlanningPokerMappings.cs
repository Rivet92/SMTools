using SMTools.Abstractions.Dtos;
using SMTools.PlanningPoker.DTOs.Hubs;
using SMTools.PlanningPoker.Models;

namespace SMTools.PlanningPoker.DTOs;

public static class PlanningPokerMappings
{
    public static List<ParticipantDto> ProjectToParticipantDto(this IEnumerable<PlanningPokerRoomParticipant> participants)
    {
        return participants
            .Where(p => !p.HasLeft)
            .OrderBy(p => p.JoinedAt)
            .Select(p => new ParticipantDto(p.Id, p.DisplayName, p.IsOwner, p.IsAdmin, p.IsConnected))
            .ToList();
    }

    public static List<VoteItemDto> ProjectToVoteItemDto(
        this IEnumerable<PlanningPokerVoteItem> voteItems,
        Guid ownParticipantId)
    {
        return voteItems
            .OrderBy(vi => vi.CreatedAt)
            .Select(vi => new VoteItemDto(
                vi.Id,
                vi.Title,
                vi.IsRevealed,
                vi.Votes
                    .Where(v => v.DeletedAt == null)
                    .OrderBy(v => v.CreatedAt)
                    .Select(v => VoteProjection.ProjectVote(v, ownParticipantId, vi.IsRevealed))
                    .ToList()))
            .ToList();
    }
}
