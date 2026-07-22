using System.Security.Claims;

namespace SMTools.Abstractions;

public static class ClaimsHelper
{
    public static Guid? TryGetUserId(ClaimsPrincipal? principal)
    {
        var userIdClaim = principal?.FindFirst(SMToolsClaimTypes.UserId)?.Value;
        return userIdClaim is not null && Guid.TryParse(userIdClaim, out var userId)
            ? userId
            : null;
    }

    public static string GetDisplayName(ClaimsPrincipal? principal)
    {
        if (principal is null)
            return "Anonymous";

        var nameClaim = principal.FindFirst(ClaimTypes.Name)?.Value;
        var givenNameClaim = principal.FindFirst(ClaimTypes.GivenName)?.Value;
        return nameClaim ?? givenNameClaim ?? principal.FindFirst("nickname")?.Value ?? "Anonymous";
    }
}

