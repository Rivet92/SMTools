using FluentAssertions;
using Microsoft.Extensions.Logging;
using NSubstitute;
using SMTools.PlanningPoker.Data;
using SMTools.PlanningPoker.DTOs.Hubs;
using SMTools.PlanningPoker.Hubs;
using SMTools.PlanningPoker.Models;
using SMTools.PlanningPoker.Services;
using SMTools.Abstractions;
using SMTools.Abstractions.Dtos;
using SMTools.Abstractions.Exceptions;
using SMTools.Abstractions.ValueObjects;

namespace SMToolsBackend.Tests.Integration.Hubs;

public sealed class PlanningPokerHubTests : HubTestBase<PlanningPokerDbContext>
{
    private readonly PlanningPokerHub _hub;
    private readonly IPlanningPokerRoomService _roomService;
    private readonly IPlanningPokerVoteItemService _voteItemService;
    private readonly PlanningPokerRoom _room;
    private readonly Guid _deckId;

    public PlanningPokerHubTests()
    {
        _deckId = Guid.NewGuid();
        _db.PlanningPokerDecks.Add(new PlanningPokerDeck
        {
            Id = _deckId,
            Key = "test",
            IsDefault = true,
        });
        _db.SaveChanges();

        var hubContext = HubTestBase.CreateHubContext("test-connection-id", "test-user", Guid.NewGuid());

        _room = new PlanningPokerRoom
        {
            Id = Guid.NewGuid(),
            Title = "Test Room",
            CreatedAt = DateTimeOffset.UtcNow,
            DeckId = _deckId,
        };
        _db.PlanningPokerRooms.Add(_room);
        _db.SaveChanges();

        var participantId = Guid.NewGuid();
        var expectedState = new RoomStateDto(
            _room.Id, _room.Title, _room.CreatedAt,
            [new ParticipantDto(participantId, "test-user", true, false, true)],
            [], participantId, _room.DeckId, false);

        _roomService = Substitute.For<IPlanningPokerRoomService>();
        _roomService.GetRoomStateAsync(_room.Id, Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(expectedState);

        _voteItemService = Substitute.For<IPlanningPokerVoteItemService>();

        var uow = new UnitOfWork<PlanningPokerDbContext>(_db);
        var logger = Substitute.For<ILogger<PlanningPokerHub>>();
        _hub = new PlanningPokerHub(_db, uow, _configuration, _roomService, _voteItemService, _versionStore, logger);
        _hub.Clients = _clients;
        _hub.Context = hubContext;
        _hub.Groups = _groups;
    }

    [Fact]
    public async Task JoinRoom_Should_Create_Participant_And_Return_State()
    {
        var state = await _hub.JoinRoom(_room.Id, null);

        state.Should().NotBeNull();
        state.Id.Should().Be(_room.Id);
        state.Participants.Should().ContainSingle(p => p.DisplayName == "test-user");
    }

    [Fact]
    public async Task JoinRoom_With_Password_Should_Validate()
    {
        _room.PasswordHash = Password.Create("secret12").Hash;
        await _db.SaveChangesAsync();

        var act = () => _hub.JoinRoom(_room.Id, null);
        await act.Should().ThrowAsync<BusinessRuleException>().WithMessage("Invalid password.");
    }

    [Fact]
    public async Task JoinRoom_With_Password_Should_Succeed()
    {
        _room.PasswordHash = Password.Create("secret12").Hash;
        await _db.SaveChangesAsync();

        var expectedState = new RoomStateDto(
            _room.Id, _room.Title, _room.CreatedAt,
            [new ParticipantDto(Guid.NewGuid(), "test-user", true, false, true)],
            [], Guid.NewGuid(), _room.DeckId, false);
        _roomService.GetRoomStateAsync(_room.Id, Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(expectedState);

        var state = await _hub.JoinRoom(_room.Id, "secret12");

        state.Should().NotBeNull();
    }

    [Fact]
    public async Task AddVoteItem_Should_Call_Service_And_Broadcast()
    {
        var state = await _hub.JoinRoom(_room.Id, null);
        var participant = _db.PlanningPokerRoomParticipants.Single(p => p.RoomId == _room.Id && !p.HasLeft);

        var resultState = new RoomStateDto(
            _room.Id, _room.Title, _room.CreatedAt,
            state.Participants,
            [new VoteItemDto(Guid.NewGuid(), "New Item", false, [])],
            state.OwnParticipantId, _room.DeckId, false);
        _voteItemService.AddVoteItemAsync(_room.Id, "New Item", participant.Id, Arg.Any<CancellationToken>())
            .Returns(resultState);

        var returnedState = await _hub.AddVoteItem(_room.Id, "New Item");

        returnedState.Should().NotBeNull();
        returnedState.VoteItems.Should().ContainSingle(v => v.Title == "New Item");
        await _clients.Group(_room.Id.ToString()).Received(2)
            .SendCoreAsync("RoomUpdated", Arg.Any<object?[]>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Vote_Should_Call_Service_And_Broadcast()
    {
        var state = await _hub.JoinRoom(_room.Id, null);
        var participant = _db.PlanningPokerRoomParticipants.Single(p => p.RoomId == _room.Id && !p.HasLeft);
        var voteItemId = Guid.NewGuid();

        var resultState = new RoomStateDto(
            _room.Id, _room.Title, _room.CreatedAt,
            state.Participants,
            [new VoteItemDto(voteItemId, "Item", false, [new VoteDto(participant.Id, "test-user", "5")])],
            state.OwnParticipantId, _room.DeckId, false);
        _voteItemService.VoteAsync(_room.Id, voteItemId, "5", participant.Id, Arg.Any<CancellationToken>())
            .Returns(resultState);

        var returnedResult = await _hub.Vote(_room.Id, voteItemId, "5");

        returnedResult.Should().NotBeNull();
        returnedResult.VoteItems.Should().ContainSingle(v => v.Id == voteItemId);
        returnedResult.Version.Should().BeGreaterThan(0);
        await _clients.Group(_room.Id.ToString()).Received(2)
            .SendCoreAsync("RoomUpdated", Arg.Any<object?[]>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task RevealVotes_Should_Call_Service_And_Broadcast()
    {
        var state = await _hub.JoinRoom(_room.Id, null);
        var participant = _db.PlanningPokerRoomParticipants.Single(p => p.RoomId == _room.Id && !p.HasLeft);
        var voteItemId = Guid.NewGuid();

        var resultState = new RoomStateDto(
            _room.Id, _room.Title, _room.CreatedAt,
            state.Participants,
            [new VoteItemDto(voteItemId, "Item", true,
                [new VoteDto(participant.Id, "test-user", "5")])],
            state.OwnParticipantId, _room.DeckId, false);
        _voteItemService.RevealVotesAsync(_room.Id, voteItemId, participant.Id, Arg.Any<CancellationToken>())
            .Returns(resultState);

        var returnedState = await _hub.RevealVotes(_room.Id, voteItemId);

        returnedState.Should().NotBeNull();
        returnedState.VoteItems.Should().ContainSingle(v => v.IsRevealed);
        await _clients.Group(_room.Id.ToString()).Received(2)
            .SendCoreAsync("RoomUpdated", Arg.Any<object?[]>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ResetVotes_Should_Call_Service_And_Broadcast()
    {
        var state = await _hub.JoinRoom(_room.Id, null);
        var participant = _db.PlanningPokerRoomParticipants.Single(p => p.RoomId == _room.Id && !p.HasLeft);
        var voteItemId = Guid.NewGuid();

        var resultState = new RoomStateDto(
            _room.Id, _room.Title, _room.CreatedAt,
            state.Participants,
            [new VoteItemDto(voteItemId, "Item", false, [])],
            state.OwnParticipantId, _room.DeckId, false);
        _voteItemService.ResetVotesAsync(_room.Id, voteItemId, participant.Id, Arg.Any<CancellationToken>())
            .Returns(resultState);

        var returnedState = await _hub.ResetVotes(_room.Id, voteItemId);

        returnedState.Should().NotBeNull();
        returnedState.VoteItems.Should().ContainSingle(v => !v.IsRevealed && v.Votes.Count == 0);
        await _clients.Group(_room.Id.ToString()).Received(2)
            .SendCoreAsync("RoomUpdated", Arg.Any<object?[]>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task FocusVoteItem_Should_Call_Service_And_Broadcast()
    {
        await _hub.JoinRoom(_room.Id, null);
        var voteItemId = Guid.NewGuid();

        await _hub.FocusVoteItem(_room.Id, voteItemId);

        await _clients.Group(_room.Id.ToString()).Received(1)
            .SendCoreAsync("FocusVoteItem", Arg.Any<object?[]>(), Arg.Any<CancellationToken>());
    }

}
