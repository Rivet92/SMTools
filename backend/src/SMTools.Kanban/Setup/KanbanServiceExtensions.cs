using FluentValidation;
using SMTools.Abstractions;
using SMTools.Abstractions.Data;
using SMTools.Abstractions.Dtos;
using SMTools.Abstractions.Endpoints;
using SMTools.Abstractions.Validation;
using SMTools.Kanban.Data;
using SMTools.Kanban.DTOs.Apis;
using SMTools.Kanban.DTOs.Hubs;
using SMTools.Kanban.Hubs;
using SMTools.Kanban.Services;

namespace SMTools.Kanban.Setup;

public static class KanbanServiceExtensions
{
    public static IServiceCollection AddKanbanServices(
        this IServiceCollection services, string connectionString, IWebHostEnvironment env)
    {
        services.AddModuleDbContext<KanbanDbContext>(connectionString, env, "kanban");

        services.AddScoped<IKanbanRepository, KanbanRepository>();
        services.AddScoped<IUnitOfWork<KanbanDbContext>, UnitOfWork<KanbanDbContext>>();
        services.AddScoped<IStateBuilder<KanbanRoomStateDto>, KanbanStateBuilder>();
        services.AddScoped<IRoomClosedNotifier>(sp =>
            sp.GetRequiredService<SignalRRoomClosedNotifier<KanbanHub>>());
        services.AddScoped<IKanbanRoomService, KanbanRoomService>();
        services.AddScoped<
            IRoomEndpointHandler<CreateKanbanRoomRequest, KanbanRoomResponse, MyRoomResponse, KanbanRoomStateDto>,
            KanbanRoomService>();
        services.AddScoped<IKanbanCardService, KanbanCardService>();
        services.AddScoped<IKanbanColumnService, KanbanColumnService>();
        services.AddScoped<IKanbanCommentService, KanbanCommentService>();

        services.AddScoped<IModuleDataHandler, KanbanDataHandler>();

        services.AddValidatorsFromAssemblyContaining<CreateRoomRequestValidator<CreateKanbanRoomRequest>>();
        services.AddTransient(typeof(IValidator<>), typeof(CreateRoomRequestValidator<>));

        return services;
    }
}
