using Serilog;
using Serilog.Events;
using Serilog.Formatting.Compact;

namespace SMTools.Api.Setup;

/// <summary>
/// Configures the application's Serilog logging pipeline.
/// </summary>
public static class LoggingSetup
{
    /// <summary>
    /// Adds Serilog to the web application builder, reading from configuration and services,
    /// and choosing the console formatter based on the hosting environment.
    /// </summary>
    /// <param name="builder">The web application builder.</param>
    /// <returns>The same builder so calls can be chained.</returns>
    public static WebApplicationBuilder AddApplicationLogging(this WebApplicationBuilder builder)
    {
        if (builder.Environment.IsEnvironment("Testing"))
            return builder;

        builder.Host.UseSerilog((context, services, configuration) =>
        {
            configuration
                .ReadFrom.Configuration(context.Configuration)
                .ReadFrom.Services(services)
                .Enrich.FromLogContext()
                .MinimumLevel.Debug()
                .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
                .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning);

            if (context.HostingEnvironment.IsDevelopment())
            {
                configuration.WriteTo.Console(
                    outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}");
            }
            else
            {
                configuration.WriteTo.Console(new CompactJsonFormatter());
            }
        });

        return builder;
    }
}
