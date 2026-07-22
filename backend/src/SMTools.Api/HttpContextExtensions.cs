using SMTools.Abstractions;

namespace SMTools.Api;

public static class HttpContextExtensions
{
    public static Guid GetRequiredUserId(this HttpContext context)
    {
        var userIdClaim = context.User.FindFirst(SMToolsClaimTypes.UserId)
            ?? throw new UnauthorizedAccessException("User ID claim not found");

        return Guid.Parse(userIdClaim.Value);
    }
}
