using System.IO.Compression;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SMTools.Abstractions.Data;
using SMTools.Abstractions.Dtos;
using SMTools.Api.Data;
using SMTools.Identity.Data;
using SMTools.Identity.DTOs;
using SMTools.Kanban.Data;
using SMTools.Notes.Data;
using SMTools.PlanningPoker.Data;
using SMTools.Retro.Data;

namespace SMTools.Api.Services;

public sealed class UserDataService
{
    private readonly IWebHostEnvironment _env;
    private readonly IEnumerable<IModuleDataHandler> _moduleHandlers;

    public UserDataService(IWebHostEnvironment env, IEnumerable<IModuleDataHandler> moduleHandlers)
    {
        _env = env;
        _moduleHandlers = moduleHandlers;
    }

    public async Task DeleteAccountAsync(
        Guid userId,
        IdentityDbContext identityDb,
        NotesDbContext notesDb,
        PlanningPokerDbContext ppDb,
        RetroDbContext retroDb,
        KanbanDbContext kanbanDb,
        CancellationToken ct)
    {
        DeleteAvatarFile(userId);

        await notesDb.Notes
            .Where(n => n.UserId == userId)
            .ExecuteDeleteAsync(ct);

        var dbByModule = new Dictionary<string, DbContext>
        {
            ["planningpoker"] = ppDb,
            ["retro"] = retroDb,
            ["kanban"] = kanbanDb,
        };

        foreach (var handler in _moduleHandlers)
        {
            if (!dbByModule.TryGetValue(handler.ModuleName, out var db))
                continue;

            var ownedRoomIds = await handler.GetOwnedRoomIdsAsync(db, userId, ct);
            if (ownedRoomIds.Count != 0)
                await handler.DeleteOwnedRoomDataAsync(db, ownedRoomIds, ct);

            await handler.DeleteMembershipsAsync(db, userId, ct);
        }

        var user = await identityDb.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is not null)
        {
            identityDb.Users.Remove(user);
            await identityDb.SaveChangesAsync(ct);
        }
    }

    public async Task<ExportDataResponse> ExportUserDataAsync(
        Guid userId,
        IdentityDbContext identityDb,
        NotesDbContext notesDb,
        PlanningPokerDbContext ppDb,
        RetroDbContext retroDb,
        KanbanDbContext kanbanDb,
        CancellationToken ct)
    {
        var user = await identityDb.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new KeyNotFoundException($"User with id {userId} not found.");

        var profile = new UserProfileDto(
            user.Id, user.Provider, user.Name, user.Email,
            user.UserAvatarUrl?.Value, user.CreatedAt, user.LastLoginAt
        );

        var notes = await notesDb.Notes
            .AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderBy(n => n.Position)
            .Select(n => new NoteDto(
                n.Id, n.Title, n.Content, n.IsArchived,
                n.Position, n.CreatedAt, n.UpdatedAt
            ))
            .ToListAsync(ct);

        var dbByModule = new Dictionary<string, (IModuleDataHandler Handler, DbContext Db)>
        {
            ["planningpoker"] = (_moduleHandlers.First(h => h.ModuleName == "planningpoker"), ppDb),
            ["retro"] = (_moduleHandlers.First(h => h.ModuleName == "retro"), retroDb),
            ["kanban"] = (_moduleHandlers.First(h => h.ModuleName == "kanban"), kanbanDb),
        };

        var allMemberships = new List<RoomMembershipDto>();
        var allRoomIds = new List<Guid>();

        foreach (var (handler, db) in dbByModule.Values)
        {
            var memberships = await handler.GetMembershipsAsync(db, userId, ct);
            allMemberships.AddRange(memberships);
            allRoomIds.AddRange(memberships.Select(m => m.RoomId));
        }

        var ppOwners = await ppDb.PlanningPokerRoomParticipants
            .AsNoTracking()
            .Where(op => allRoomIds.Contains(op.RoomId) && op.IsOwner)
            .Select(op => new { op.RoomId, OwnerId = op.Id, OwnerName = op.DisplayName })
            .ToListAsync(ct);

        var retroOwners = await retroDb.RetroRoomParticipants
            .AsNoTracking()
            .Where(op => allRoomIds.Contains(op.RoomId) && op.IsOwner)
            .Select(op => new { op.RoomId, OwnerId = op.Id, OwnerName = op.DisplayName })
            .ToListAsync(ct);

        var kanbanOwners = await kanbanDb.KanbanRoomParticipants
            .AsNoTracking()
            .Where(op => allRoomIds.Contains(op.RoomId) && op.IsOwner)
            .Select(op => new { op.RoomId, OwnerId = op.Id, OwnerName = op.DisplayName })
            .ToListAsync(ct);

        var ownersByRoom = ppOwners
            .Concat(retroOwners)
            .Concat(kanbanOwners)
            .GroupBy(o => o.RoomId)
            .ToDictionary(g => g.Key, g => g.First());

        var rooms = allMemberships
            .Select(m =>
            {
                var owner = ownersByRoom.GetValueOrDefault(m.RoomId);
                return new RoomMembershipDto(
                    m.Module, m.RoomId, m.RoomTitle, m.IsOwner, m.IsAdmin,
                    owner?.OwnerId, owner?.OwnerName, m.JoinedAt);
            })
            .ToList();

        var userPlanningPokerRoomIds = allMemberships
            .Where(m => m.Module == "planningpoker")
            .Select(m => m.RoomId)
            .ToList();

        var voteItems = await ppDb.PlanningPokerVoteItems
            .AsNoTracking()
            .Where(vi => userPlanningPokerRoomIds.Contains(vi.RoomId))
            .Select(vi => new
            {
                vi.Id,
                RoomTitle = vi.Room.Title,
                vi.Title,
                vi.IsRevealed,
                vi.CreatedAt
            })
            .OrderBy(vi => vi.CreatedAt)
            .ToListAsync(ct);

        var voteItemIds = voteItems.Select(vi => vi.Id).ToList();

        var votes = await ppDb.PlanningPokerVotes
            .AsNoTracking()
            .Where(v => voteItemIds.Contains(v.VoteItemId) && v.DeletedAt == null)
            .Select(v => new
            {
                v.VoteItemId,
                ParticipantId = v.Participant.Id,
                ParticipantName = v.Participant.DisplayName,
                ParticipantUserId = v.Participant.UserId,
                v.Value
            })
            .ToListAsync(ct);

        var votesByItem = votes.GroupBy(v => v.VoteItemId).ToDictionary(g => g.Key, g => g.ToList());

        var planningPokerVoteItems = voteItems.Select(vi =>
        {
            var itemVotes = votesByItem.GetValueOrDefault(vi.Id, []);
            return new ExportPlanningPokerVoteItemDto(
                vi.Id,
                vi.RoomTitle,
                vi.Title,
                vi.IsRevealed,
                itemVotes.FirstOrDefault(v => v.ParticipantUserId == userId)?.Value,
                itemVotes.Select(v => new ExportPlanningPokerVoteDto(v.VoteItemId, v.ParticipantId, v.ParticipantName, v.Value)).ToList(),
                vi.CreatedAt
            );
        }).ToList();

        var userRetroRoomIds = allMemberships
            .Where(m => m.Module == "retro")
            .Select(m => m.RoomId)
            .ToList();

        var retroCards = await retroDb.RetroCards
            .AsNoTracking()
            .Where(c => userRetroRoomIds.Contains(c.RoomId) && c.DeletedAt == null)
            .Select(c => new ExportRetroCardDto(
                c.Id,
                c.RoomId,
                c.Room.Title,
                c.ColumnId,
                c.Column.Key,
                c.Content,
                c.AuthorParticipantId,
                c.Author.DisplayName,
                c.CreatedAt
            ))
            .ToListAsync(ct);

        var retroActionItems = await retroDb.RetroActionItems
            .AsNoTracking()
            .Where(a => userRetroRoomIds.Contains(a.RoomId))
            .Select(a => new ExportRetroActionItemDto(
                a.Id,
                a.RoomId,
                a.Room.Title,
                a.Content,
                a.AssigneeParticipantId,
                a.Assignee != null ? a.Assignee.DisplayName : null,
                a.CreatedAt
            ))
            .ToListAsync(ct);

        var retroVotes = await retroDb.RetroVotes
            .AsNoTracking()
            .Where(v => userRetroRoomIds.Contains(v.RoomId) && v.DeletedAt == null)
            .Select(v => new ExportRetroVoteDto(
                v.Id,
                v.RoomId,
                v.Room.Title,
                v.CardId,
                v.Card.Content,
                v.ParticipantId,
                v.Participant.DisplayName,
                v.Points,
                v.CreatedAt
            ))
            .ToListAsync(ct);

        var userKanbanRoomIds = allMemberships
            .Where(m => m.Module == "kanban")
            .Select(m => m.RoomId)
            .ToList();

        var kanbanCards = await kanbanDb.KanbanCards
            .AsNoTracking()
            .Where(c => userKanbanRoomIds.Contains(c.RoomId) && c.DeletedAt == null)
            .Select(c => new ExportKanbanCardDto(
                c.Id,
                c.RoomId,
                c.Room.Title,
                c.ColumnId,
                c.Column.Title,
                c.Title,
                c.Description,
                c.AuthorParticipantId,
                c.AuthorParticipant.DisplayName,
                c.AssignedParticipantId,
                c.Assignee != null ? c.Assignee.DisplayName : null,
                c.CreatedAt
            ))
            .ToListAsync(ct);

        var kanbanComments = await kanbanDb.KanbanCardComments
            .AsNoTracking()
            .Where(c => userKanbanRoomIds.Contains(c.Card.RoomId) && c.DeletedAt == null)
            .Select(c => new ExportKanbanCommentDto(
                c.Id,
                c.CardId,
                c.Card.Title,
                c.Card.RoomId,
                c.Card.Room.Title,
                c.AuthorParticipantId,
                c.AuthorParticipant.DisplayName,
                c.Content,
                c.CreatedAt
            ))
            .ToListAsync(ct);

        return new ExportDataResponse(
            profile, notes, rooms,
            planningPokerVoteItems, retroCards, retroActionItems, retroVotes,
            kanbanCards, kanbanComments, []);
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public async Task<string> ExportToZipAsync(
        Guid userId,
        IdentityDbContext identityDb,
        NotesDbContext notesDb,
        PlanningPokerDbContext ppDb,
        RetroDbContext retroDb,
        KanbanDbContext kanbanDb,
        AuditDbContext auditDb,
        CancellationToken ct)
    {
        var dir = Path.Combine(Path.GetTempPath(), $"smtools-export-{Guid.NewGuid():N}");
        Directory.CreateDirectory(dir);
        var zipPath = Path.Combine(dir, "export.zip");

        var user = await identityDb.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new KeyNotFoundException($"User with id {userId} not found.");

        using var fileStream = new FileStream(zipPath, FileMode.Create);
        using var archive = new ZipArchive(fileStream, ZipArchiveMode.Create);

        await WriteEntryAsync(archive, "profile.json", new
        {
            user.Id,
            user.Provider,
            user.Name,
            user.Email,
            AvatarUrl = user.UserAvatarUrl?.Value,
            user.CreatedAt,
            user.LastLoginAt
        }, ct);

        var notes = await notesDb.Notes
            .AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderBy(n => n.Position)
            .Select(n => new
            {
                n.Id,
                n.Title,
                n.Content,
                n.IsArchived,
                n.Position,
                n.CreatedAt,
                n.UpdatedAt
            })
            .ToListAsync(ct);
        await WriteEntryAsync(archive, "notes.json", notes, ct);

        var dbByModule = new Dictionary<string, (IModuleDataHandler Handler, DbContext Db)>
        {
            ["planningpoker"] = (_moduleHandlers.First(h => h.ModuleName == "planningpoker"), ppDb),
            ["retro"] = (_moduleHandlers.First(h => h.ModuleName == "retro"), retroDb),
            ["kanban"] = (_moduleHandlers.First(h => h.ModuleName == "kanban"), kanbanDb),
        };

        var allMemberships = new List<RoomMembershipDto>();
        var allRoomIds = new List<Guid>();

        foreach (var (handler, db) in dbByModule.Values)
        {
            var memberships = await handler.GetMembershipsAsync(db, userId, ct);
            allMemberships.AddRange(memberships);
            allRoomIds.AddRange(memberships.Select(m => m.RoomId));
        }

        var ppOwners = await ppDb.PlanningPokerRoomParticipants
            .AsNoTracking()
            .Where(op => allRoomIds.Contains(op.RoomId) && op.IsOwner)
            .Select(op => new { op.RoomId, OwnerId = op.Id, OwnerName = op.DisplayName })
            .ToListAsync(ct);

        var retroOwners = await retroDb.RetroRoomParticipants
            .AsNoTracking()
            .Where(op => allRoomIds.Contains(op.RoomId) && op.IsOwner)
            .Select(op => new { op.RoomId, OwnerId = op.Id, OwnerName = op.DisplayName })
            .ToListAsync(ct);

        var kanbanOwners = await kanbanDb.KanbanRoomParticipants
            .AsNoTracking()
            .Where(op => allRoomIds.Contains(op.RoomId) && op.IsOwner)
            .Select(op => new { op.RoomId, OwnerId = op.Id, OwnerName = op.DisplayName })
            .ToListAsync(ct);

        var ownersByRoom = ppOwners
            .Concat(retroOwners)
            .Concat(kanbanOwners)
            .GroupBy(o => o.RoomId)
            .ToDictionary(g => g.Key, g => g.First());

        var rooms = allMemberships
            .Select(m =>
            {
                var owner = ownersByRoom.GetValueOrDefault(m.RoomId);
                return new
                {
                    m.Module,
                    m.RoomId,
                    m.RoomTitle,
                    m.IsOwner,
                    m.IsAdmin,
                    OwnerParticipantId = (Guid?)owner?.OwnerId,
                    OwnerName = owner?.OwnerName,
                    m.JoinedAt
                };
            })
            .ToList();
        await WriteEntryAsync(archive, "rooms.json", rooms, ct);

        var userPlanningPokerRoomIds = allMemberships
            .Where(m => m.Module == "planningpoker")
            .Select(m => m.RoomId)
            .ToList();

        var voteItems = await ppDb.PlanningPokerVoteItems
            .AsNoTracking()
            .Where(vi => userPlanningPokerRoomIds.Contains(vi.RoomId))
            .Select(vi => new
            {
                vi.Id,
                RoomTitle = vi.Room.Title,
                vi.Title,
                vi.IsRevealed,
                vi.CreatedAt
            })
            .OrderBy(vi => vi.CreatedAt)
            .ToListAsync(ct);

        var voteItemIds = voteItems.Select(vi => vi.Id).ToList();

        var votes = await ppDb.PlanningPokerVotes
            .AsNoTracking()
            .Where(v => voteItemIds.Contains(v.VoteItemId) && v.DeletedAt == null)
            .Select(v => new
            {
                v.VoteItemId,
                ParticipantId = v.Participant.Id,
                ParticipantName = v.Participant.DisplayName,
                ParticipantUserId = v.Participant.UserId,
                v.Value
            })
            .ToListAsync(ct);

        var votesByItem = votes.GroupBy(v => v.VoteItemId).ToDictionary(g => g.Key, g => g.ToList());

        var planningPokerVoteItems = voteItems.Select(vi =>
        {
            var itemVotes = votesByItem.GetValueOrDefault(vi.Id, []);
            return new
            {
                VoteItemId = vi.Id,
                vi.RoomTitle,
                VoteItemTitle = vi.Title,
                vi.IsRevealed,
                UserVoteValue = itemVotes.FirstOrDefault(v => v.ParticipantUserId == userId)?.Value,
                Votes = itemVotes.Select(v => new { v.VoteItemId, v.ParticipantId, v.ParticipantName, v.Value })
            };
        }).ToList();
        await WriteEntryAsync(archive, "planning-poker.json", planningPokerVoteItems, ct);

        var userRetroRoomIds = allMemberships
            .Where(m => m.Module == "retro")
            .Select(m => m.RoomId)
            .ToList();

        var retroCards = await retroDb.RetroCards
            .AsNoTracking()
            .Where(c => userRetroRoomIds.Contains(c.RoomId) && c.DeletedAt == null)
            .Select(c => new
            {
                CardId = c.Id,
                c.RoomId,
                RoomTitle = c.Room.Title,
                c.ColumnId,
                ColumnKey = c.Column.Key,
                c.Content,
                c.AuthorParticipantId,
                AuthorName = c.Author.DisplayName,
                c.CreatedAt
            })
            .ToListAsync(ct);
        await WriteEntryAsync(archive, "retro-cards.json", retroCards, ct);

        var retroActionItems = await retroDb.RetroActionItems
            .AsNoTracking()
            .Where(a => userRetroRoomIds.Contains(a.RoomId))
            .Select(a => new
            {
                ActionItemId = a.Id,
                a.RoomId,
                RoomTitle = a.Room.Title,
                a.Content,
                a.AssigneeParticipantId,
                AssigneeName = a.Assignee != null ? a.Assignee.DisplayName : null,
                a.CreatedAt
            })
            .ToListAsync(ct);
        await WriteEntryAsync(archive, "retro-action-items.json", retroActionItems, ct);

        var retroVotes = await retroDb.RetroVotes
            .AsNoTracking()
            .Where(v => userRetroRoomIds.Contains(v.RoomId) && v.DeletedAt == null)
            .Select(v => new
            {
                VoteId = v.Id,
                v.RoomId,
                RoomTitle = v.Room.Title,
                v.CardId,
                CardContent = v.Card.Content,
                v.ParticipantId,
                ParticipantName = v.Participant.DisplayName,
                v.Points,
                v.CreatedAt
            })
            .ToListAsync(ct);
        await WriteEntryAsync(archive, "retro-votes.json", retroVotes, ct);

        var userKanbanRoomIds = allMemberships
            .Where(m => m.Module == "kanban")
            .Select(m => m.RoomId)
            .ToList();

        var kanbanCards = await kanbanDb.KanbanCards
            .AsNoTracking()
            .Where(c => userKanbanRoomIds.Contains(c.RoomId) && c.DeletedAt == null)
            .Select(c => new
            {
                CardId = c.Id,
                c.RoomId,
                RoomTitle = c.Room.Title,
                c.ColumnId,
                ColumnTitle = c.Column.Title,
                c.Title,
                c.Description,
                c.AuthorParticipantId,
                AuthorName = c.AuthorParticipant.DisplayName,
                c.AssignedParticipantId,
                AssigneeName = c.Assignee != null ? c.Assignee.DisplayName : null,
                c.CreatedAt
            })
            .ToListAsync(ct);
        await WriteEntryAsync(archive, "kanban-cards.json", kanbanCards, ct);

        var kanbanComments = await kanbanDb.KanbanCardComments
            .AsNoTracking()
            .Where(c => userKanbanRoomIds.Contains(c.Card.RoomId) && c.DeletedAt == null)
            .Select(c => new
            {
                CommentId = c.Id,
                c.CardId,
                CardTitle = c.Card.Title,
                c.Card.RoomId,
                RoomTitle = c.Card.Room.Title,
                c.AuthorParticipantId,
                AuthorName = c.AuthorParticipant.DisplayName,
                c.Content,
                c.CreatedAt
            })
            .ToListAsync(ct);
        await WriteEntryAsync(archive, "kanban-comments.json", kanbanComments, ct);

        var auditTotal = await auditDb.AuditEntries
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .CountAsync(ct);

        const int auditPageSize = 500;
        var auditPages = (int)Math.Ceiling((double)auditTotal / auditPageSize);

        for (var page = 1; page <= auditPages; page++)
        {
            var auditPage = await auditDb.AuditEntries
                .AsNoTracking()
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.Timestamp)
                .Skip((page - 1) * auditPageSize)
                .Take(auditPageSize)
                .Select(a => new ExportAuditEntryDto(
                    a.Id, a.Action, a.EntityType, a.EntityId,
                    a.OldValues, a.NewValues, a.Timestamp, a.IpAddress))
                .ToListAsync(ct);

            await WriteEntryAsync(archive, $"audit-{page}.json", auditPage, ct);
        }

        return zipPath;
    }

    private static async Task WriteEntryAsync<T>(ZipArchive archive, string name, T data, CancellationToken ct)
    {
        var entry = archive.CreateEntry(name);
        using var stream = entry.Open();
        await JsonSerializer.SerializeAsync(stream, data, JsonOptions, ct);
    }

    private void DeleteAvatarFile(Guid userId)
    {
        var avatarsDir = Path.Combine(_env.WebRootPath, "avatars");
        if (!Directory.Exists(avatarsDir))
            return;

        foreach (var existing in Directory.EnumerateFiles(avatarsDir, $"{userId:N}.*"))
        {
            try
            {
                File.Delete(existing);
            }
            catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
            {
            }
        }
    }
}
