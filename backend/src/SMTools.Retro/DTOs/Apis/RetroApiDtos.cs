using SMTools.Retro.DTOs.Hubs;
using SMTools.Abstractions;

namespace SMTools.Retro.DTOs.Apis;

public sealed record CreateRetroRoomRequest(string Title, string? Password, Guid? TemplateId) : ICreateRoomRequest;

public sealed record RetroRoomResponse(Guid Id, string Title, DateTimeOffset CreatedAt, Guid TemplateId, bool HasPassword) : ICreateRoomResponse;

public sealed record RetroTemplateResponse(Guid Id, string Key, bool IsDefault, List<RetroColumnDto> Columns);
