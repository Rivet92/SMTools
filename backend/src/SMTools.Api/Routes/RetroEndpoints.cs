using SMTools.Abstractions;
using SMTools.Abstractions.Dtos;
using SMTools.Retro.DTOs.Apis;
using SMTools.Retro.DTOs.Hubs;
using SMTools.Api.Setup;

namespace SMTools.Api.Routes;

public static class RetroEndpoints
{
    public static RouteGroupBuilder MapRetroEndpoints(this RouteGroupBuilder api)
    {
        var group = api.MapGroup("/retro");

        group.MapCommonRoomEndpoints<CreateRetroRoomRequest, RetroRoomResponse, MyRoomResponse, RetroRoomStateDto>(
            "Retro");

        group.MapGet("/templates", async (MasterDataCache cache, CancellationToken ct) =>
            Results.Ok(await cache.GetTemplatesAsync(ct)))
            .WithName("GetRetroTemplates")
            .Produces<List<RetroTemplateResponse>>(StatusCodes.Status200OK);

        return api;
    }
}
