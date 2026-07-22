using SMTools.Abstractions.Dtos;
using SMTools.Abstractions.Hubs;

namespace SMTools.Retro.DTOs.Hubs;

public sealed record RetroColumnDto(Guid Id, string Key, int DisplayOrder, string Color, string Icon);

public sealed record RetroCardDto(
    Guid Id,
    Guid ColumnId,
    Guid? GroupId,
    string Content,
    Guid AuthorParticipantId,
    DateTimeOffset CreatedAt,
    int VoteCount,
    int OwnVotePoints
);

public sealed record RetroCardGroupDto(Guid Id, string Title, DateTimeOffset CreatedAt, List<Guid> CardIds);

public sealed record RetroActionItemDto(Guid Id, string Content, Guid? AssigneeParticipantId, DateTimeOffset CreatedAt);

public sealed record RetroRoomStateDto(
    Guid Id,
    string Title,
    DateTimeOffset CreatedAt,
    string Phase,
    Guid TemplateId,
    List<ParticipantDto> Participants,
    List<RetroColumnDto> Columns,
    List<RetroCardDto> Cards,
    List<RetroCardGroupDto> Groups,
    List<RetroActionItemDto> ActionItems,
    Guid OwnParticipantId,
    bool HasPassword
) : IVersionedState
{
    public int Version { get; set; }
}
