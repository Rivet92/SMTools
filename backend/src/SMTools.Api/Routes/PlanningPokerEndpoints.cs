using SMTools.Abstractions;
using SMTools.Abstractions.Dtos;
using SMTools.PlanningPoker.Data;
using SMTools.PlanningPoker.DTOs.Apis;
using SMTools.PlanningPoker.DTOs.Hubs;
using SMTools.Api.Setup;

namespace SMTools.Api.Routes;

public static class PlanningPokerEndpoints
{
    public static RouteGroupBuilder MapPlanningPokerEndpoints(this RouteGroupBuilder api)
    {
        var group = api.MapGroup("/planningpoker");

        group.MapCommonRoomEndpoints<CreatePlanningPokerRoomRequest, PlanningPokerRoomResponse, MyRoomResponse, RoomStateDto>(
            "PlanningPoker");

        group.MapGet("/decks", async (MasterDataCache cache, CancellationToken ct) =>
            Results.Ok(await cache.GetDecksAsync(ct)))
            .WithName("GetPlanningPokerDecks")
            .Produces<List<PlanningPokerDeckDto>>(StatusCodes.Status200OK);

        return api;
    }
}
