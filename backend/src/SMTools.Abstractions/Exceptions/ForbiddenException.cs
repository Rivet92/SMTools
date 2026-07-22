using Microsoft.AspNetCore.Http;

namespace SMTools.Abstractions.Exceptions;

public sealed class ForbiddenException(string message) : DomainException(message)
{
    public override int HttpStatusCode => StatusCodes.Status403Forbidden;
    public override string ErrorCode => "forbidden";
}
