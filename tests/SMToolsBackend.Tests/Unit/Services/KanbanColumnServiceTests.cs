using FluentAssertions;
using NSubstitute;
using SMTools.Abstractions;
using SMTools.Kanban.Data;
using SMTools.Kanban.DTOs.Hubs;
using SMTools.Kanban.Models;
using SMTools.Kanban.Services;

namespace SMToolsBackend.Tests.Unit.Services;

public sealed class KanbanColumnServiceTests
{
    private readonly IKanbanRepository _repo = Substitute.For<IKanbanRepository>();
    private readonly IStateBuilder<KanbanRoomStateDto> _stateBuilder = Substitute.For<IStateBuilder<KanbanRoomStateDto>>();
    private readonly IUnitOfWork<KanbanDbContext> _uow = Substitute.For<IUnitOfWork<KanbanDbContext>>();
    private readonly KanbanColumnService _sut;

    public KanbanColumnServiceTests()
    {
        _stateBuilder.BuildStateAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(new KanbanRoomStateDto(Guid.NewGuid(), "Test", DateTimeOffset.UtcNow, [], [], [], Guid.NewGuid(), false));
        _sut = new KanbanColumnService(_repo, _stateBuilder, _uow);
    }

    [Fact]
    public async Task AddColumnAsync_Should_Add_And_Return_State()
    {
        var roomId = Guid.NewGuid();
        var participantId = Guid.NewGuid();

        _repo.GetNextColumnOrderAsync(roomId, Arg.Any<CancellationToken>()).Returns(0);

        var state = await _sut.AddColumnAsync(roomId, "New Column", null, participantId, CancellationToken.None);

        await _repo.Received(1).AddColumnAsync(Arg.Is<KanbanColumn>(c => c!.Title == "New Column"), Arg.Any<CancellationToken>());
        await _uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
