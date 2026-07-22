using SMTools.Abstractions;
using SMTools.Notes.DTOs;
using SMTools.Notes.Services;

namespace SMTools.Api.Routes;

public static class NotesEndpoints
{
    public static RouteGroupBuilder MapNotesEndpoints(this RouteGroupBuilder api)
    {
        var group = api.MapGroup("/notes");

        group.MapGet("/", async (
            INotesService service,
            HttpContext httpContext,
            [AsParameters] PagedRequest paging,
            bool? archived,
            CancellationToken cancellationToken) =>
        {
            var userId = httpContext.GetRequiredUserId();

            var result = await service.GetNotesPagedAsync(userId, archived, paging, cancellationToken);
            return Results.Ok(result);
        })
        .WithName("GetNotes")
        .WithTags("Notes")
        .Produces<PagedResponse<NoteDto>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .RequireAuthorization();

        group.MapPost("/", async (
            CreateNoteRequest request,
            INotesService service,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var userId = httpContext.GetRequiredUserId();

            var dto = await service.CreateNoteAsync(userId, request, cancellationToken);
            return Results.Created($"/api/notes/{dto.Id}", dto);
        })
        .WithName("CreateNote")
        .WithTags("Notes")
        .RequireAuthorization()
        .WithValidation<CreateNoteRequest>()
        .Produces<NoteDto>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized);

        group.MapPut("/{noteId}", async (
            Guid noteId,
            UpdateNoteRequest request,
            INotesService service,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var userId = httpContext.GetRequiredUserId();

            var dto = await service.UpdateNoteAsync(noteId, userId, request, cancellationToken);
            return Results.Ok(dto);
        })
        .WithName("UpdateNote")
        .WithTags("Notes")
        .RequireAuthorization()
        .WithValidation<UpdateNoteRequest>()
        .Produces<NoteDto>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapDelete("/{noteId}", async (
            Guid noteId,
            INotesService service,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var userId = httpContext.GetRequiredUserId();

            await service.DeleteNoteAsync(noteId, userId, cancellationToken);
            return Results.NoContent();
        })
        .WithName("DeleteNote")
        .WithTags("Notes")
        .RequireAuthorization()
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPut("/{noteId}/archive", async (
            Guid noteId,
            INotesService service,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var userId = httpContext.GetRequiredUserId();

            var dto = await service.ToggleArchiveAsync(noteId, userId, cancellationToken);
            return Results.Ok(dto);
        })
        .WithName("ToggleArchiveNote")
        .WithTags("Notes")
        .RequireAuthorization()
        .Produces<NoteDto>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPut("/reorder", async (
            ReorderNotesRequest request,
            INotesService service,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var userId = httpContext.GetRequiredUserId();

            await service.ReorderNotesAsync(userId, request, cancellationToken);
            return Results.Ok();
        })
        .WithName("ReorderNotes")
        .WithTags("Notes")
        .RequireAuthorization()
        .WithValidation<ReorderNotesRequest>()
        .Produces(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized);

        return api;
    }
}
