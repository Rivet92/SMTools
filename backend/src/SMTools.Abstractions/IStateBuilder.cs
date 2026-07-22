namespace SMTools.Abstractions;

public interface IStateBuilder<TState>
{
    Task<TState> BuildStateAsync(Guid roomId, Guid ownParticipantId, CancellationToken ct);
}
