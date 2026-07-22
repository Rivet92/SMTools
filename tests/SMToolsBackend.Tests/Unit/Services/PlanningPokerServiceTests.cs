using FluentAssertions;
using NSubstitute;
using SMTools.Abstractions;
using SMTools.Abstractions.Dtos;
using SMTools.Abstractions.Exceptions;
using SMTools.Abstractions.Hubs;
using SMTools.PlanningPoker.Data;
using SMTools.PlanningPoker.DTOs.Apis;
using SMTools.PlanningPoker.DTOs.Hubs;
using SMTools.PlanningPoker.Models;
using SMTools.PlanningPoker.Services;

namespace SMToolsBackend.Tests.Unit.Services;

public sealed class PlanningPokerRoomServiceTests
{
    private readonly IPlanningPokerRepository _repo = Substitute.For<IPlanningPokerRepository>();
    private readonly IUnitOfWork<PlanningPokerDbContext> _uow = Substitute.For<IUnitOfWork<PlanningPokerDbContext>>();
    private readonly IRoomVersionStore _roomVersionStore = Substitute.For<IRoomVersionStore>();
    private readonly IStateBuilder<RoomStateDto> _stateBuilder = Substitute.For<IStateBuilder<RoomStateDto>>();
    private readonly PlanningPokerRoomService _sut;

    public PlanningPokerRoomServiceTests()
    {
        _sut = new PlanningPokerRoomService(_repo, _uow, _roomVersionStore, _stateBuilder, null!);
    }

    [Fact]
    public async Task GetRoomStateAsync_Should_Throw_When_RoomNotFound()
    {
        _stateBuilder.BuildStateAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromException<RoomStateDto>(new NotFoundException<PlanningPokerRoom>(Guid.NewGuid())));

        await _sut.Invoking(s => s.GetRoomStateAsync(Guid.NewGuid(), Guid.NewGuid(), CancellationToken.None))
            .Should().ThrowAsync<NotFoundException<PlanningPokerRoom>>();
    }

    [Fact]
    public async Task GetRoomStateAsync_Should_Return_State_When_RoomExists()
    {
        var roomId = Guid.NewGuid();
        var participantId = Guid.NewGuid();
        var expectedState = new RoomStateDto(
            roomId, "Test Room", DateTimeOffset.UtcNow,
            [new ParticipantDto(participantId, "Owner", true, false, true)],
            [], participantId, Guid.NewGuid(), false);

        _stateBuilder.BuildStateAsync(roomId, participantId, Arg.Any<CancellationToken>()).Returns(expectedState);

        var state = await _sut.GetRoomStateAsync(roomId, participantId, CancellationToken.None);

        state.Id.Should().Be(roomId);
        state.Title.Should().Be("Test Room");
        state.Participants.Should().ContainSingle(p => p.Id == participantId);
    }

    [Fact]
    public async Task DeleteRoomAsync_Should_Throw_When_Not_Owner()
    {
        var roomId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        _repo.IsRoomOwnerAsync(roomId, userId, Arg.Any<CancellationToken>()).Returns(false);

        await _sut.Invoking(s => s.DeleteRoomAsync(roomId, userId, CancellationToken.None))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task GetResults_WithNonParticipant_Throws_ParticipantNotFoundException()
    {
        var roomId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var room = new PlanningPokerRoom
        {
            Id = roomId,
            Title = "Test Room",
            CreatedAt = DateTimeOffset.UtcNow,
            DeckId = Guid.NewGuid(),
            Participants = [],
        };

        _repo.GetRoomAsync(roomId, Arg.Any<CancellationToken>()).Returns(room);
        _repo.GetParticipantByUserAsync(roomId, userId, Arg.Any<CancellationToken>())
            .Returns((PlanningPokerRoomParticipant?)null);

        await _sut.Invoking(s => s.GetResultsAsync(roomId, userId, CancellationToken.None))
            .Should().ThrowAsync<NotFoundException<PlanningPokerRoomParticipant>>();
    }

    [Fact]
    public async Task LeaveRoomAsync_Should_Close_Room_When_Last_Participant()
    {
        var roomId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var participant = new PlanningPokerRoomParticipant
        {
            Id = Guid.NewGuid(),
            RoomId = roomId,
            UserId = userId,
            HasLeft = false,
        };

        _repo.GetParticipantByUserAsync(roomId, userId, Arg.Any<CancellationToken>()).Returns(participant);
        _repo.HasParticipantsAsync(roomId, Arg.Any<CancellationToken>()).Returns(false);

        var result = await _sut.LeaveRoomAsync(roomId, userId, CancellationToken.None);

        result.RoomClosed.Should().BeTrue();
        participant.HasLeft.Should().BeTrue();
        await _repo.Received(1).DeleteRoomAsync(roomId, Arg.Any<CancellationToken>());
        await _uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
        _roomVersionStore.Received(1).Clear(roomId);
    }

    [Fact]
    public async Task LeaveRoomAsync_Should_Not_Clear_VersionStore_When_Participants_Remain()
    {
        var roomId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var participant = new PlanningPokerRoomParticipant
        {
            Id = Guid.NewGuid(),
            RoomId = roomId,
            UserId = userId,
            HasLeft = false,
        };

        _repo.GetParticipantByUserAsync(roomId, userId, Arg.Any<CancellationToken>()).Returns(participant);
        _repo.HasParticipantsAsync(roomId, Arg.Any<CancellationToken>()).Returns(true);

        var result = await _sut.LeaveRoomAsync(roomId, userId, CancellationToken.None);

        result.RoomClosed.Should().BeFalse();
        _roomVersionStore.DidNotReceive().Clear(roomId);
    }

    [Fact]
    public async Task DeleteRoomAsync_Should_Clear_VersionStore()
    {
        var roomId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        _repo.IsRoomOwnerAsync(roomId, userId, Arg.Any<CancellationToken>()).Returns(true);
        _repo.GetRoomAsync(roomId, Arg.Any<CancellationToken>())
            .Returns(new PlanningPokerRoom { Id = roomId, Title = "Test", CreatedAt = DateTimeOffset.UtcNow, DeckId = Guid.NewGuid() });

        await _sut.DeleteRoomAsync(roomId, userId, CancellationToken.None);

        _roomVersionStore.Received(1).Clear(roomId);
    }

    [Fact]
    public async Task DeleteRoomAsync_Should_Not_Clear_VersionStore_When_Not_Owner()
    {
        var roomId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        _repo.IsRoomOwnerAsync(roomId, userId, Arg.Any<CancellationToken>()).Returns(false);

        await _sut.Invoking(s => s.DeleteRoomAsync(roomId, userId, CancellationToken.None))
            .Should().ThrowAsync<ForbiddenException>();

        _roomVersionStore.DidNotReceive().Clear(roomId);
    }
}

public sealed class RoomVersionStoreTests
{
    [Fact]
    public void NextVersion_Should_Increment_For_Same_Room()
    {
        var store = new RoomVersionStore();
        var roomId = Guid.NewGuid();

        var v1 = store.NextVersion(roomId);
        var v2 = store.NextVersion(roomId);
        var v3 = store.NextVersion(roomId);

        v1.Should().Be(1);
        v2.Should().Be(2);
        v3.Should().Be(3);
    }

    [Fact]
    public void NextVersion_Should_Be_Independent_Per_Room()
    {
        var store = new RoomVersionStore();
        var roomA = Guid.NewGuid();
        var roomB = Guid.NewGuid();

        store.NextVersion(roomA);
        store.NextVersion(roomA);
        store.NextVersion(roomB);

        store.NextVersion(roomA).Should().Be(3);
        store.NextVersion(roomB).Should().Be(2);
    }

    [Fact]
    public void Clear_Should_Remove_Room_Version()
    {
        var store = new RoomVersionStore();
        var roomId = Guid.NewGuid();

        store.NextVersion(roomId);
        store.NextVersion(roomId);
        store.Clear(roomId);

        store.NextVersion(roomId).Should().Be(1);
    }

    [Fact]
    public void Count_Should_Return_NumberOf_Tracked_Rooms()
    {
        var store = new RoomVersionStore();

        store.NextVersion(Guid.NewGuid());
        store.NextVersion(Guid.NewGuid());
        store.NextVersion(Guid.NewGuid());

        store.Count.Should().Be(3);
    }

    [Fact]
    public void Clear_Should_Reduce_Count()
    {
        var store = new RoomVersionStore();
        var room1 = Guid.NewGuid();
        var room2 = Guid.NewGuid();

        store.NextVersion(room1);
        store.NextVersion(room2);

        store.Clear(room1);

        store.Count.Should().Be(1);
    }

    [Fact]
    public void GetCurrentVersion_Should_Return_Zero_When_No_Version()
    {
        var store = new RoomVersionStore();

        var version = store.GetCurrentVersion(Guid.NewGuid());

        version.Should().Be(0);
    }

    [Fact]
    public void GetCurrentVersion_Should_Return_Current_Version_Without_Incrementing()
    {
        var store = new RoomVersionStore();
        var roomId = Guid.NewGuid();

        store.NextVersion(roomId);
        store.NextVersion(roomId);

        var current = store.GetCurrentVersion(roomId);
        var next = store.NextVersion(roomId);

        current.Should().Be(2);
        next.Should().Be(3);
    }
}
