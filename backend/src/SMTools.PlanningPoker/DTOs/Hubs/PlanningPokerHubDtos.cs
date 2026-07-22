using SMTools.Abstractions.Dtos;
using SMTools.Abstractions.Hubs;

namespace SMTools.PlanningPoker.DTOs.Hubs;

public sealed record VoteDto(Guid ParticipantId, string ParticipantName, string? Value);

public sealed record VoteItemDto(Guid Id, string Title, bool IsRevealed, List<VoteDto> Votes);

public sealed record RoomStateDto(
    Guid Id,
    string Title,
    DateTimeOffset CreatedAt,
    List<ParticipantDto> Participants,
    List<VoteItemDto> VoteItems,
    Guid OwnParticipantId,
    Guid DeckId,
    bool HasPassword
) : IVersionedState
{
    public int Version { get; set; }
}

// Delta payloads para broadcasts optimizados
public sealed record VoteUpdatePayload(Guid VoteItemId, int Version);

public sealed record VoteRevealedPayload(Guid VoteItemId, int Version);

public sealed record VoteItemAddedPayload(Guid VoteItemId, string Title, int Version);

public sealed record VoteItemDeletedPayload(Guid VoteItemId, int Version);

public sealed record VotesResetPayload(Guid VoteItemId, int Version);

public sealed record VoteHiddenPayload(Guid VoteItemId, int Version);

public sealed record FocusVoteItemPayload(Guid VoteItemId, int Version);

// Result wrapper para Vote: permite al cliente descartar respuestas tardías
// comparando la versión con la que ya tenga del broadcast VoteUpdated.
public sealed record VoteResult(RoomStateDto State);
