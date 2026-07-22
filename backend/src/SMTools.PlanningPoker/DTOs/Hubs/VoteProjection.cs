using SMTools.PlanningPoker.Models;

namespace SMTools.PlanningPoker.DTOs.Hubs;

public static class VoteProjection
{
    public static VoteDto ProjectVote(PlanningPokerVote v, Guid ownParticipantId, bool isRevealed)
    {
        var value = (isRevealed || v.ParticipantId == ownParticipantId) ? v.Value : null;
        return new VoteDto(v.ParticipantId, v.Participant.DisplayName, value);
    }
}
