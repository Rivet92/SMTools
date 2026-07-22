namespace SMTools.Abstractions;

public interface ICreateRoomRequest
{
    string Title { get; }
    string? Password { get; }
}
