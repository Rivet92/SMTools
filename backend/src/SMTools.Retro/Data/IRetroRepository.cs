using SMTools.Abstractions;
using SMTools.Abstractions.Dtos;
using SMTools.Retro.DTOs.Apis;
using SMTools.Retro.DTOs.Hubs;
using SMTools.Retro.Models;

namespace SMTools.Retro.Data;

public interface IRetroRepository : IRoomRepository<RetroRoom, RetroRoomParticipant>
{
    Task<RetroRoom?> GetFullRoomStateAsync(Guid roomId, CancellationToken ct);

    Task<List<ParticipantDto>> GetParticipantsAsync(Guid roomId, CancellationToken ct);
    Task<RetroRoomParticipant?> GetParticipantAsync(Guid participantId, Guid roomId, CancellationToken ct);

    Task<List<RetroTemplateResponse>> GetTemplatesAsync(CancellationToken ct);
    Task<Guid> GetDefaultTemplateIdAsync(CancellationToken ct);

    Task<bool> ColumnExistsAsync(Guid columnId, Guid templateId, CancellationToken ct);

    Task<RetroCard?> GetCardAsync(Guid cardId, Guid roomId, CancellationToken ct);
    Task AddCardAsync(RetroCard card, CancellationToken ct);
    Task DeleteCardAsync(Guid cardId, CancellationToken ct);
    Task<List<RetroCard>> GetCardsByGroupAsync(Guid groupId, CancellationToken ct);

    Task<RetroCardGroup?> GetGroupAsync(Guid groupId, Guid roomId, CancellationToken ct);
    Task AddGroupAsync(RetroCardGroup group, CancellationToken ct);
    Task DeleteGroupAsync(Guid groupId, CancellationToken ct);

    Task<int> GetUsedVotePointsAsync(Guid roomId, Guid participantId, CancellationToken ct);
    Task<RetroVote?> GetVoteAsync(Guid cardId, Guid participantId, CancellationToken ct);
    Task AddVoteAsync(RetroVote vote, CancellationToken ct);
    Task DeleteVoteAsync(Guid voteId);

    Task<RetroActionItem?> GetActionItemAsync(Guid actionItemId, Guid roomId, CancellationToken ct);
    Task AddActionItemAsync(RetroActionItem actionItem, CancellationToken ct);
    Task DeleteActionItemAsync(Guid actionItemId, CancellationToken ct);

    Task DeleteVotesForCardAsync(Guid cardId, CancellationToken ct);

    Task LockVoteResourcesAsync(Guid roomId, Guid participantId, CancellationToken ct);
}
