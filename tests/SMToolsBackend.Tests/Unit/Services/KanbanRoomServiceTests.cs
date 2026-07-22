using FluentAssertions;
using NSubstitute;
using SMTools.Abstractions;
using SMTools.Abstractions.Exceptions;
using SMTools.Kanban.Data;
using SMTools.Kanban.DTOs.Hubs;
using SMTools.Kanban.Models;
using SMTools.Kanban.Services;

namespace SMToolsBackend.Tests.Unit.Services;

public sealed class KanbanRoomServiceTests
{
    private readonly IKanbanRepository _repo = Substitute.For<IKanbanRepository>();
    private readonly IStateBuilder<KanbanRoomStateDto> _stateBuilder = Substitute.For<IStateBuilder<KanbanRoomStateDto>>();
    private readonly IUnitOfWork<KanbanDbContext> _uow = Substitute.For<IUnitOfWork<KanbanDbContext>>();
    private readonly KanbanRoomService _sut;

    public KanbanRoomServiceTests()
    {
        _stateBuilder.BuildStateAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(new KanbanRoomStateDto(Guid.NewGuid(), "Test", DateTimeOffset.UtcNow, [], [], [], Guid.NewGuid(), false));
        _sut = new KanbanRoomService(_repo, _stateBuilder, _uow, null!);
    }

    [Fact]
    public async Task GetRoomStateAsync_Should_Delegate_To_StateBuilder()
    {
        var roomId = Guid.NewGuid();
        var participantId = Guid.NewGuid();

        var state = await _sut.GetRoomStateAsync(roomId, participantId, CancellationToken.None);

        await _stateBuilder.Received(1).BuildStateAsync(roomId, participantId, CancellationToken.None);
    }

    [Fact]
    public async Task GetResults_WithNonParticipant_Throws_ParticipantNotFoundException()
    {
        var roomId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var room = new KanbanRoom
        {
            Id = roomId,
            Title = "Test Room",
            CreatedAt = DateTimeOffset.UtcNow,
            Participants = [],
        };

        _repo.GetRoomAsync(roomId, Arg.Any<CancellationToken>()).Returns(room);
        _repo.GetParticipantByUserAsync(roomId, userId, Arg.Any<CancellationToken>())
            .Returns((KanbanRoomParticipant?)null);

        await _sut.Invoking(s => s.GetResultsAsync(roomId, userId, CancellationToken.None))
            .Should().ThrowAsync<NotFoundException<KanbanRoomParticipant>>();
    }
}
