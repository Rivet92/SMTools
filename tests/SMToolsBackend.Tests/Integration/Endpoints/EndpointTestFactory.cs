using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace SMToolsBackend.Tests.Integration.Endpoints;

public class EndpointTestFactory : WebApplicationFactory<Program>
{
    private readonly Dictionary<Type, object> _replacedServices = [];

    public EndpointTestFactory()
    {
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Testing");
    }

    public EndpointTestFactory WithReplacedService<TService>(object implementation)
        where TService : class
    {
        _replacedServices[typeof(TService)] = implementation;
        return this;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices((context, services) =>
        {
            foreach (var (serviceType, implementation) in _replacedServices)
            {
                var descriptor = services.SingleOrDefault(d => d.ServiceType == serviceType);
                if (descriptor is not null)
                    services.Remove(descriptor);

                services.AddSingleton(serviceType, implementation);
            }
        });

        builder.UseEnvironment("Testing");
    }
}
