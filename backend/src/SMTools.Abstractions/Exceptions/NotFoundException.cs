using Microsoft.AspNetCore.Http;

namespace SMTools.Abstractions.Exceptions;

public sealed class NotFoundException<TEntity> : DomainException
{
    public NotFoundException(Guid id)
        : base($"{typeof(TEntity).Name} with id {id} was not found")
    {
        EntityId = id;
    }

    public NotFoundException(string message) : base(message) { }

    public Guid? EntityId { get; }

    public override int HttpStatusCode => StatusCodes.Status404NotFound;

    public override string ErrorCode => "not_found";
}
