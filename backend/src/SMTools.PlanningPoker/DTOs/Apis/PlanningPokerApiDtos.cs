using SMTools.Abstractions;

namespace SMTools.PlanningPoker.DTOs.Apis;

public sealed record CreatePlanningPokerRoomRequest(string Title, string? Password, Guid? DeckId) : ICreateRoomRequest;

public sealed record PlanningPokerRoomResponse(
    Guid Id,
    string Title,
    DateTimeOffset CreatedAt,
    Guid DeckId,
    bool HasPassword
) : ICreateRoomResponse;

public sealed record PlanningPokerCardDto(Guid Id, string Value, int DisplayOrder);

public sealed record PlanningPokerDeckDto(Guid Id, string Key, bool IsDefault, List<PlanningPokerCardDto> Cards);
