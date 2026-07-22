using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Serilog;
using Serilog.Events;
using SMTools.Abstractions;
using SMTools.Api.Setup;

// Load .env file in development so OAuth secrets are read from environment variables.
if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
{
    EnvLoader.TryLoadFromProjectRoot();
}

EnvLoader.EnsureConnectionString();

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console(
        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.AddApplicationLogging();
    builder.Services.AddApplicationServices(builder.Configuration, builder.Environment);

    var app = builder.Build();

    // Middleware and endpoints must be registered before starting the server,
    // even in --dump-openapi mode (needed for MapOpenApi() routes).
    app.UseApplicationMiddleware(app.Environment);
    app.MapApplicationEndpoints(app.Environment);

    var dumpPath = args.FirstOrDefault(a => a.StartsWith("--dump-openapi=", StringComparison.Ordinal));
    if (dumpPath is not null)
    {
        var outPath = dumpPath["--dump-openapi=".Length..];
        app.Urls.Clear();
        app.Urls.Add("http://127.0.0.1:0");
        await app.StartAsync();
        var server = app.Services.GetRequiredService<IServer>();
        var addresses = server.Features.Get<IServerAddressesFeature>()!;
        var httpClient = new HttpClient();
        var json = await httpClient.GetStringAsync($"{addresses.Addresses.First()}/openapi/v1.json");
        // Post-process: fix schemas so generated TypeScript types are usable.
        // - type arrays ["integer","string"] -> type:"integer"
        // - add "required" arrays for schemas with non-nullable properties
        var doc = System.Text.Json.Nodes.JsonNode.Parse(json)!;
        FixOpenApiSchemas(doc);
        var options = new System.Text.Json.JsonSerializerOptions { WriteIndented = true };
        await File.WriteAllTextAsync(outPath, doc.ToJsonString(options));
        await app.StopAsync();
        return;
    }

    // Apply pending migrations and seed data.
    // Retry a few times to give PostgreSQL time to be ready, both in dev and in containerized deployments.
    await app.ApplyMigrationsWithRetryAsync();

    app.Run();
}
catch (HostAbortedException)
{
    // EF Core design-time tools abort the host intentionally; do not log it as a fatal error.
    throw;
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
    throw;
}
finally
{
    await Log.CloseAndFlushAsync();
}

static void FixOpenApiSchemas(System.Text.Json.Nodes.JsonNode? node)
{
    if (node is System.Text.Json.Nodes.JsonObject obj)
    {
        // Fix type arrays on the current object's direct properties
        // (children haven't been recursed into yet, so we fix inline scalar properties here)
        if (obj.TryGetPropertyValue("type", out var typeVal) && typeVal is System.Text.Json.Nodes.JsonArray arr)
        {
            var types = arr.Select(t => t?.GetValue<string>()).OfType<string>().ToList();
            if (types.Count == 2 && types.Contains("string") && types.Contains("integer"))
            {
                obj["type"] = "integer";
            }
            else if (types.Count == 2 && types.Contains("string") && types.Contains("number"))
            {
                obj["type"] = "number";
            }
            else if (types.Count == 2 && types.Contains("null"))
            {
                obj["type"] = types.First(t => t != "null");
                obj["nullable"] = true;
            }
            else if (types.Count == 3 && types.Contains("null") && types.Contains("number") && types.Contains("string"))
            {
                obj["type"] = "number";
                obj["nullable"] = true;
            }
            else if (types.Count == 3 && types.Contains("null") && types.Contains("integer") && types.Contains("string"))
            {
                obj["type"] = "integer";
                obj["nullable"] = true;
            }
        }

        // Recurse first so child schemas are fixed before adding "required"
        foreach (var kvp in obj.ToList())
        {
            FixOpenApiSchemas(kvp.Value);
        }

        // Add "required" for schema objects that have "properties" and no "required"
        // Must run after recursion so property nullable flags are already resolved.
        if (obj.TryGetPropertyValue("properties", out var propsVal) && propsVal is System.Text.Json.Nodes.JsonObject props)
        {
            if (!obj.ContainsKey("required") && !obj.ContainsKey("allOf") && !obj.ContainsKey("anyOf") && !obj.ContainsKey("oneOf"))
            {
                var required = new List<string>();
                foreach (var kvp in props)
                {
                    if (kvp.Value is System.Text.Json.Nodes.JsonObject propObj)
                    {
                        // Non-nullable properties are required
                        var nullable = propObj.TryGetPropertyValue("nullable", out var n) && n?.GetValue<bool>() == true;
                        if (!nullable)
                        {
                            required.Add(kvp.Key);
                        }
                    }
                }
                if (required.Count > 0)
                {
                    obj["required"] = new System.Text.Json.Nodes.JsonArray(required.Select(r => System.Text.Json.Nodes.JsonValue.Create(r)).ToArray());
                }
            }
        }
    }
    else if (node is System.Text.Json.Nodes.JsonArray jarr)
    {
        foreach (var item in jarr)
        {
            FixOpenApiSchemas(item);
        }
    }
}
