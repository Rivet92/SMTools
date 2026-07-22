using System.Net;
using Microsoft.AspNetCore.SignalR;
using SMTools.Abstractions;

namespace SMTools.Api.Middleware;

public sealed class AuditContextHubFilter : IHubFilter
{
    public async ValueTask<object?> InvokeMethodAsync(
        HubInvocationContext invocationContext,
        Func<HubInvocationContext, ValueTask<object?>> next)
    {
        var accessor = invocationContext.ServiceProvider.GetRequiredService<ICurrentUserAccessor>();
        var httpContext = invocationContext.Context.GetHttpContext();
        var remoteIp = httpContext?.Connection.RemoteIpAddress;
        var ip = remoteIp is not null
            ? remoteIp.IsIPv4MappedToIPv6 ? remoteIp.MapToIPv4().ToString()
              : IPAddress.IsLoopback(remoteIp) ? "127.0.0.1"
              : remoteIp.ToString()
            : null;
        accessor.SetUser(ClaimsHelper.TryGetUserId(httpContext?.User), ip);

        return await next(invocationContext);
    }
}
