using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace SMTools.Abstractions.Exceptions;

public sealed class DomainExceptionHubFilter : IHubFilter
{
    private readonly ILogger<DomainExceptionHubFilter> _logger;

    public DomainExceptionHubFilter(ILogger<DomainExceptionHubFilter> logger)
    {
        _logger = logger;
    }

    public async ValueTask<object?> InvokeMethodAsync(
        HubInvocationContext invocationContext,
        Func<HubInvocationContext, ValueTask<object?>> next)
    {
        try
        {
            return await next(invocationContext);
        }
        catch (DomainException ex)
        {
            _logger.LogDebug(ex, "DomainException in {Method} (Connection: {ConnectionId}): {Message}",
                invocationContext.HubMethodName,
                invocationContext.Context.ConnectionId,
                ex.Message);

            var payload = JsonSerializer.Serialize(new { ex.ErrorCode, ex.Message });
            throw new HubException(payload);
        }
    }
}
