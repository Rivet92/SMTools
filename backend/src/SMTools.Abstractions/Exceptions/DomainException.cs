namespace SMTools.Abstractions.Exceptions;

public abstract class DomainException(string message) : Exception(message)
{
    public abstract int HttpStatusCode { get; }

    public abstract string ErrorCode { get; }
}
