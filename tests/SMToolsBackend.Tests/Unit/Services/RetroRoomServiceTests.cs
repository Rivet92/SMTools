using FluentAssertions;
using NSubstitute;
using SMTools.Abstractions;
using SMTools.Abstractions.Exceptions;
using SMTools.Retro.Data;
using SMTools.Retro.Exceptions;
using SMTools.Retro.DTOs.Hubs;
using SMTools.Retro.Models;
using SMTools.Retro.Services;

namespace SMToolsBackend.Tests.Unit.Services;

public sealed class RetroRoomServiceTests
{
    private readonly IRetroRepository _repo = Substitute.For<IRetroRepository>();
    private readonly IStateBuilder<RetroRoomStateDto> _stateBuilder = Substitute.For<IStateBuilder<RetroRoomStateDto>>();
    private readonly IUnitOfWork<RetroDbContext> _uow = Substitute.For<IUnitOfWork<RetroDbContext>>();
    private readonly RetroRoomService _sut;

    public RetroRoomServiceTests()
    {
        _stateBuilder.BuildStateAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(new RetroRoomStateDto(Guid.Empty, string.Empty, DateTimeOffset.MinValue, "Gathering", Guid.Empty, [], [], [], [], [], Guid.Empty, false));
        _sut = new RetroRoomService(_repo, _stateBuilder, _uow, null!);
    }

    [Fact]
    public async Task GetRoomStateAsync_Should_Throw_When_RoomNotFound()
    {
        var roomId = Guid.NewGuid();
        _stateBuilder.BuildStateAsync(roomId, Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromException<RetroRoomStateDto>(new NotFoundException<RetroRoom>(roomId)));

        await _sut.Invoking(s => s.GetRoomStateAsync(roomId, Guid.NewGuid(), CancellationToken.None))
            .Should().ThrowAsync<NotFoundException<RetroRoom>>();
    }

    [Fact]
    public async Task GetResults_WithNonParticipant_Throws_ParticipantNotFoundException()
    {
        var roomId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var room = new RetroRoom
        {
            Id = roomId,
            Title = "Test Room",
            CreatedAt = DateTimeOffset.UtcNow,
            Participants = [],
        };

        _repo.GetRoomAsync(roomId, Arg.Any<CancellationToken>()).Returns(room);
        _repo.GetParticipantByUserAsync(roomId, userId, Arg.Any<CancellationToken>())
            .Returns((RetroRoomParticipant?)null);

        await _sut.Invoking(s => s.GetResultsAsync(roomId, userId, CancellationToken.None))
            .Should().ThrowAsync<NotFoundException<RetroRoomParticipant>>();
    }

    [Fact]
    public async Task SetPhaseAsync_Should_Throw_When_Same_Phase()
    {
        var roomId = Guid.NewGuid();
        var room = new RetroRoom
        {
            Id = roomId,
        };

        _repo.GetRoomAsync(roomId, Arg.Any<CancellationToken>()).Returns(room);

        await _sut.Invoking(s => s.SetPhaseAsync(roomId, (int)RetroPhase.Gathering, Guid.NewGuid(), CancellationToken.None))
            .Should().ThrowAsync<InvalidPhaseTransitionException>();
    }

    [Fact]
    public async Task SetPhaseAsync_Should_Transition_When_Valid()
    {
        var roomId = Guid.NewGuid();
        var participantId = Guid.NewGuid();
        var templateId = Guid.NewGuid();
        var room = new RetroRoom
        {
            Id = roomId,
            TemplateId = templateId,
            Template = new RetroTemplate
            {
                Id = templateId,
                Columns = [],
            },
            CreatedAt = DateTimeOffset.UtcNow,
            Participants = [],
            Cards = [],
        };

        _repo.GetRoomAsync(roomId, Arg.Any<CancellationToken>()).Returns(room);

        _stateBuilder.BuildStateAsync(roomId, participantId, Arg.Any<CancellationToken>())
            .Returns(new RetroRoomStateDto(
                roomId, room.Title, room.CreatedAt,
                "Grouping", templateId,
                [], [], [], [], [], participantId, false));

        var state = await _sut.SetPhaseAsync(roomId, (int)RetroPhase.Grouping, participantId, CancellationToken.None);

        room.Phase.Should().Be(RetroPhase.Grouping);
        state.Phase.Should().Be("Grouping");
        await _uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
