using Microsoft.AspNetCore.Mvc;
using SMTools.Abstractions;
using SMTools.Abstractions.Endpoints;
using SMTools.Api.Routes;
using SMTools.Kanban.Hubs;
using SMTools.PlanningPoker.Hubs;
using SMTools.Retro.Hubs;
using Scalar.AspNetCore;

namespace SMTools.Api.Setup;

public static class EndpointExtensions
{
    public static IEndpointRouteBuilder MapApplicationEndpoints(this IEndpointRouteBuilder app, IWebHostEnvironment environment)
    {
        if (environment.IsDevelopment() || environment.IsEnvironment("Testing"))
        {
            app.MapOpenApi();
        }
        if (environment.IsDevelopment())
        {
            app.MapScalarApiReference();
        }

        app.MapHealthChecks("/health/live", new() { Predicate = _ => true });
        app.MapHealthChecks("/health/ready", new() { Predicate = r => r.Tags.Contains("ready") });

        var api = app.MapGroup("/api").RequireCors("AllowFrontend").RequireRateLimiting("AuthenticatedUserPolicy");

        api.MapAuthEndpoints(environment);
        api.MapPlanningPokerEndpoints();
        api.MapRetroEndpoints();
        api.MapKanbanEndpoints();
        api.MapNotesEndpoints();
        api.MapAuditEndpoints();

        app.MapHub<PlanningPokerHub>("/hubs/planning-poker").RequireCors("AllowFrontend").RequireRateLimiting("AuthenticatedUserPolicy");
        app.MapHub<RetroHub>("/hubs/retro").RequireCors("AllowFrontend").RequireRateLimiting("AuthenticatedUserPolicy");
        app.MapHub<KanbanHub>("/hubs/kanban").RequireCors("AllowFrontend").RequireRateLimiting("AuthenticatedUserPolicy");

        app.Map("/api/{**path}", () => Results.Problem(statusCode: 404));
        app.Map("/hubs/{**path}", () => Results.NotFound());

        app.MapFallbackToFile("index.html");

        return app;
    }

    public static RouteGroupBuilder MapCommonRoomEndpoints<TCreateRequest, TCreateResponse, TMyRoomResponse, TResultsResponse>(
        this RouteGroupBuilder group,
        string namePrefix)
        where TCreateRequest : ICreateRoomRequest
        where TCreateResponse : ICreateRoomResponse
    {
        group.MapPost("/rooms", async ([FromBody] TCreateRequest request, HttpContext httpContext,
            [FromServices] IRoomEndpointHandler<TCreateRequest, TCreateResponse, TMyRoomResponse, TResultsResponse> handler,
            CancellationToken ct) =>
        {
            var result = await handler.CreateRoomAsync(request, httpContext.User, ct);
            return Results.Created($"/api/{namePrefix.ToLower()}/rooms/{result.Id}", result);
        })
            .WithName($"Create{namePrefix}Room")
            .RequireAuthorization()
            .WithValidation<TCreateRequest>()
            .Produces<TCreateResponse>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        group.MapGet("/rooms/my", async (HttpContext httpContext, [AsParameters] PagedRequest paging,
            [FromServices] IRoomEndpointHandler<TCreateRequest, TCreateResponse, TMyRoomResponse, TResultsResponse> handler,
            CancellationToken ct) =>
        {
            var userId = httpContext.GetRequiredUserId();
            var items = await handler.GetMyRoomsAsync(userId, ct);
            return Results.Ok(items.ToPagedResponse(paging));
        })
            .WithName($"GetMy{namePrefix}Rooms")
            .RequireAuthorization()
            .Produces<PagedResponse<TMyRoomResponse>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        group.MapDelete("/rooms/{roomId}/participants/me", async (Guid roomId, HttpContext httpContext,
            [FromServices] IRoomEndpointHandler<TCreateRequest, TCreateResponse, TMyRoomResponse, TResultsResponse> handler,
            CancellationToken ct) =>
        {
            var userId = httpContext.GetRequiredUserId();
            await handler.LeaveRoomAsync(roomId, userId, ct);
            return Results.NoContent();
        })
            .WithName($"RemoveSelfFrom{namePrefix}Room")
            .RequireAuthorization()
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapDelete("/rooms/{roomId}", async (Guid roomId, HttpContext httpContext,
            [FromServices] IRoomEndpointHandler<TCreateRequest, TCreateResponse, TMyRoomResponse, TResultsResponse> handler,
            CancellationToken ct) =>
        {
            var userId = httpContext.GetRequiredUserId();
            await handler.DeleteRoomAsync(roomId, userId, ct);
            return Results.NoContent();
        })
            .WithName($"Delete{namePrefix}Room")
            .RequireAuthorization()
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapGet("/rooms/{roomId}/results", async (Guid roomId, HttpContext httpContext,
            [FromServices] IRoomEndpointHandler<TCreateRequest, TCreateResponse, TMyRoomResponse, TResultsResponse> handler,
            CancellationToken ct) =>
        {
            var userId = httpContext.GetRequiredUserId();
            return Results.Ok(await handler.GetResultsAsync(roomId, userId, ct));
        })
            .WithName($"Get{namePrefix}RoomResults")
            .RequireAuthorization()
            .Produces<TResultsResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);

        return group;
    }
}
