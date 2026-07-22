using SMTools.Abstractions.Dtos;
using SMTools.Retro.DTOs.Hubs;
using SMTools.Retro.Models;

namespace SMTools.Retro.DTOs;

// NOTE: These extension methods work on in-memory collections (IEnumerable<T>).
// The repository (RetroRepository) keeps its projections inline because EF Core
// translates .Select() to SQL and cannot translate custom extension methods.
// Both approaches produce the same DTO structure; the duplication is intentional:
// one path is SQL-translatable (repo), the other is in-memory (StateBuilder).

public static class RetroMappings
{
    public static List<ParticipantDto> ProjectToParticipantDto(
        this IEnumerable<RetroRoomParticipant> participants)
    {
        return participants
            .OrderBy(p => p.JoinedAt)
            .Select(p => new ParticipantDto(
                p.Id, p.DisplayName, p.IsOwner, p.IsAdmin, p.IsConnected))
            .ToList();
    }

    public static List<RetroColumnDto> ProjectToColumnDto(
        this IEnumerable<RetroColumn> columns)
    {
        return columns
            .OrderBy(c => c.DisplayOrder)
            .Select(c => new RetroColumnDto(
                c.Id, c.Key, c.DisplayOrder, c.Color, c.Icon))
            .ToList();
    }
}
