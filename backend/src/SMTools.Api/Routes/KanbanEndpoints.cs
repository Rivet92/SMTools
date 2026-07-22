using SMTools.Abstractions.Dtos;
using SMTools.Kanban.DTOs.Apis;
using SMTools.Kanban.DTOs.Hubs;
using SMTools.Api.Setup;

namespace SMTools.Api.Routes;

public static class KanbanEndpoints
{
    public static RouteGroupBuilder MapKanbanEndpoints(this RouteGroupBuilder api)
    {
        var group = api.MapGroup("/kanban");

        group.MapCommonRoomEndpoints<CreateKanbanRoomRequest, KanbanRoomResponse, MyRoomResponse, KanbanRoomStateDto>(
            "Kanban");

        return api;
    }
}
