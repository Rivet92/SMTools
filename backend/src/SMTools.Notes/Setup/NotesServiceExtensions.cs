using FluentValidation;
using SMTools.Abstractions;
using SMTools.Abstractions.Data;
using SMTools.Notes.Data;
using SMTools.Notes.Services;
using SMTools.Notes.Validation;

namespace SMTools.Notes.Setup;

public static class NotesServiceExtensions
{
    public static IServiceCollection AddNotesServices(
        this IServiceCollection services, IConfiguration config, IWebHostEnvironment env)
    {
        var connectionString = config.GetConnectionString("DefaultConnection");
        services.AddModuleDbContext<NotesDbContext>(connectionString!, env, "notes");

        services.AddScoped<INotesRepository, NotesRepository>();
        services.AddScoped<IUnitOfWork<NotesDbContext>, UnitOfWork<NotesDbContext>>();
        services.AddScoped<INotesService, NotesService>();

        services.AddScoped<IModuleDataHandler, NotesDataHandler>();

        services.AddValidatorsFromAssemblyContaining<CreateNoteRequestValidator>();

        return services;
    }
}
