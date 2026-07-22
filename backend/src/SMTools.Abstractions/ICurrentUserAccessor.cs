namespace SMTools.Abstractions;

public interface ICurrentUserAccessor
{
    Guid? UserId { get; }
    string? IpAddress { get; }
    void SetUser(Guid? userId, string? ipAddress);
}
