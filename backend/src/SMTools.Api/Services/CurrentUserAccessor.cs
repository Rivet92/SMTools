using SMTools.Abstractions;

namespace SMTools.Api.Services;

public sealed class CurrentUserAccessor : ICurrentUserAccessor
{
    public Guid? UserId { get; private set; }
    public string? IpAddress { get; private set; }

    public void SetUser(Guid? userId, string? ipAddress)
    {
        UserId = userId;
        IpAddress = ipAddress;
    }
}
