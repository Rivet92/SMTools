using FluentValidation;
using SMTools.Abstractions;
using SMTools.Abstractions.Data;
using SMTools.Abstractions.Dtos;
using SMTools.Abstractions.Endpoints;
using SMTools.Abstractions.Validation;
using SMTools.PlanningPoker.Data;
using SMTools.PlanningPoker.DTOs.Apis;
using SMTools.PlanningPoker.DTOs.Hubs;
using SMTools.PlanningPoker.Hubs;
using SMTools.PlanningPoker.Services;

namespace SMTools.PlanningPoker.Setup;

public static class PlanningPokerServiceExtensions
{
    public static IServiceCollection AddPlanningPokerServices(
        this IServiceCollection services, string connectionString, IWebHostEnvironment env)
    {
        services.AddModuleDbContext<PlanningPokerDbContext>(connectionString, env, "planningpoker");

        services.AddScoped<IPlanningPokerRepository, PlanningPokerRepository>();
        services.AddScoped<IUnitOfWork<PlanningPokerDbContext>, UnitOfWork<PlanningPokerDbContext>>();
        services.AddScoped<IStateBuilder<RoomStateDto>, PlanningPokerStateBuilder>();
        services.AddScoped<IRoomClosedNotifier>(sp =>
            sp.GetRequiredService<SignalRRoomClosedNotifier<PlanningPokerHub>>());
        services.AddScoped<IPlanningPokerRoomService, PlanningPokerRoomService>();
        services.AddScoped<
            IRoomEndpointHandler<CreatePlanningPokerRoomRequest, PlanningPokerRoomResponse, MyRoomResponse, RoomStateDto>,
            PlanningPokerRoomService>();
        services.AddScoped<IPlanningPokerVoteItemService, PlanningPokerVoteItemService>();

        services.AddScoped<IModuleDataHandler, PlanningPokerDataHandler>();

        services.AddValidatorsFromAssemblyContaining<CreateRoomRequestValidator<CreatePlanningPokerRoomRequest>>();
        services.AddTransient(typeof(IValidator<>), typeof(CreateRoomRequestValidator<>));

        return services;
    }
}
