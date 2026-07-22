using FluentValidation;
using SMTools.Abstractions;
using SMTools.Abstractions.Data;
using SMTools.Abstractions.Dtos;
using SMTools.Abstractions.Endpoints;
using SMTools.Abstractions.Validation;
using SMTools.Retro.Data;
using SMTools.Retro.DTOs.Apis;
using SMTools.Retro.DTOs.Hubs;
using SMTools.Retro.Hubs;
using SMTools.Retro.Services;

namespace SMTools.Retro.Setup;

public static class RetroServiceExtensions
{
    public static IServiceCollection AddRetroServices(
        this IServiceCollection services, string connectionString, IWebHostEnvironment env)
    {
        services.AddModuleDbContext<RetroDbContext>(connectionString, env, "retro");

        services.AddScoped<IRetroRepository, RetroRepository>();
        services.AddScoped<IUnitOfWork<RetroDbContext>, UnitOfWork<RetroDbContext>>();
        services.AddScoped<IStateBuilder<RetroRoomStateDto>, RetroStateBuilder>();
        services.AddScoped<IRoomClosedNotifier>(sp =>
            sp.GetRequiredService<SignalRRoomClosedNotifier<RetroHub>>());
        services.AddScoped<IRetroRoomService, RetroRoomService>();
        services.AddScoped<
            IRoomEndpointHandler<CreateRetroRoomRequest, RetroRoomResponse, MyRoomResponse, RetroRoomStateDto>,
            RetroRoomService>();
        services.AddScoped<IRetroCardService, RetroCardService>();
        services.AddScoped<IRetroVoteService, RetroVoteService>();
        services.AddScoped<IRetroActionItemService, RetroActionItemService>();

        services.AddScoped<IModuleDataHandler, RetroDataHandler>();

        services.AddValidatorsFromAssemblyContaining<CreateRoomRequestValidator<CreateRetroRoomRequest>>();
        services.AddTransient(typeof(IValidator<>), typeof(CreateRoomRequestValidator<>));

        return services;
    }
}
