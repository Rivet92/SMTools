using Microsoft.AspNetCore.Http;

namespace SMTools.Abstractions.Exceptions;

public sealed class ParticipantNotInRoomException(string message) : DomainException(message)
{
    public override int HttpStatusCode => StatusCodes.Status404NotFound;
    public override string ErrorCode => "participant_not_in_room";
}
