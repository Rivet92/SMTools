using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SMTools.Api.Data;
using SMTools.Api.Services;
using SMTools.Identity.Data;
using SMTools.Identity.DTOs;
using SMTools.Notes.Data;
using SMTools.PlanningPoker.Data;
using SMTools.Retro.Data;
using SMTools.Kanban.Data;

namespace SMTools.Api.Routes;

public static partial class AuthEndpoints
{
    public static RouteGroupBuilder MapDataEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/export", async (
            HttpContext context,
            [FromServices] UserDataService userDataService,
            [FromServices] IdentityDbContext identityDb,
            [FromServices] NotesDbContext notesDb,
            [FromServices] PlanningPokerDbContext planningPokerDb,
            [FromServices] RetroDbContext retroDb,
            [FromServices] KanbanDbContext kanbanDb,
            [FromServices] AuditDbContext auditDb,
            CancellationToken ct) =>
        {
            var userId = context.GetRequiredUserId();

            string zipPath;
            try
            {
                zipPath = await userDataService.ExportToZipAsync(userId, identityDb, notesDb, planningPokerDb, retroDb, kanbanDb, auditDb, ct);
            }
            catch (KeyNotFoundException)
            {
                return Results.NotFound();
            }

            var dir = Path.GetDirectoryName(zipPath);
            context.Response.OnCompleted(() =>
            {
                if (dir is not null && Directory.Exists(dir))
                    Directory.Delete(dir, recursive: true);
                return Task.CompletedTask;
            });

            var date = DateTimeOffset.UtcNow.ToString("yyyy-MM-dd");
            return Results.File(zipPath, "application/zip", $"smtools-export-{date}.zip");
        })
        .RequireAuthorization()
        .WithName("ExportUserData")
        .WithTags("Auth");

        group.MapDelete("/account", async (
            HttpContext context,
            [FromServices] UserDataService userDataService,
            [FromServices] IdentityDbContext identityDb,
            [FromServices] NotesDbContext notesDb,
            [FromServices] PlanningPokerDbContext planningPokerDb,
            [FromServices] RetroDbContext retroDb,
            [FromServices] KanbanDbContext kanbanDb,
            [FromServices] AuditDbContext auditDb,
            [FromServices] ILogger<Program> logger,
            CancellationToken ct) =>
        {
            var userId = context.GetRequiredUserId();

            await auditDb.AuditEntries
                .Where(a => a.UserId == userId)
                .ExecuteDeleteAsync(ct);

            await userDataService.DeleteAccountAsync(userId, identityDb, notesDb, planningPokerDb, retroDb, kanbanDb, ct);

            await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

            LogInformationAccountDeleted(logger, userId);

            return Results.Ok();
        })
        .RequireAuthorization()
        .WithName("DeleteAccount")
        .WithTags("Auth");

        return group;
    }

    [LoggerMessage(Level = LogLevel.Information, Message = "Account deleted: user {UserId}")]
    private static partial void LogInformationAccountDeleted(ILogger logger, Guid userId);
}
