using FluentAssertions;
using Microsoft.EntityFrameworkCore.Storage;
using NSubstitute;
using SMTools.Abstractions;
using SMTools.PlanningPoker.Data;
using SMTools.PlanningPoker.DTOs.Apis;
using SMTools.PlanningPoker.DTOs.Hubs;
using SMTools.Abstractions.Exceptions;
using SMTools.PlanningPoker.Models;
using SMTools.PlanningPoker.Services;

namespace SMToolsBackend.Tests.Unit.Services;

public sealed class PlanningPokerVoteItemServiceTests
{
    private readonly IPlanningPokerRepository _repo = Substitute.For<IPlanningPokerRepository>();
    private readonly IUnitOfWork<PlanningPokerDbContext> _uow = Substitute.For<IUnitOfWork<PlanningPokerDbContext>>();
    private readonly IStateBuilder<RoomStateDto> _stateBuilder = Substitute.For<IStateBuilder<RoomStateDto>>();
    private readonly PlanningPokerVoteItemService _sut;

    public PlanningPokerVoteItemServiceTests()
    {
        _sut = new PlanningPokerVoteItemService(_repo, _uow, _stateBuilder);
    }

    [Fact]
    public async Task AddVoteItemAsync_Should_Add_And_Return_State()
    {
        var roomId = Guid.NewGuid();
        var participantId = Guid.NewGuid();
        var expectedState = new RoomStateDto(
            roomId, "Test", DateTimeOffset.UtcNow,
            [], [], participantId, Guid.NewGuid(), false);

        _stateBuilder.BuildStateAsync(roomId, participantId, Arg.Any<CancellationToken>()).Returns(expectedState);

        var state = await _sut.AddVoteItemAsync(roomId, "New Item", participantId, CancellationToken.None);

        await _repo.Received(1).AddVoteItemAsync(Arg.Is<PlanningPokerVoteItem>(vi => vi!.Title == "New Item"), Arg.Any<CancellationToken>());
        await _uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task VoteAsync_Should_Throw_When_VoteItem_NotFound()
    {
        _repo.GetVoteItemAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns((PlanningPokerVoteItem?)null);

        await _sut.Invoking(s => s.VoteAsync(Guid.NewGuid(), Guid.NewGuid(), "5", Guid.NewGuid(), CancellationToken.None))
            .Should().ThrowAsync<NotFoundException<PlanningPokerVoteItem>>();
    }

    [Fact]
    public async Task VoteAsync_Should_Throw_When_Item_Revealed()
    {
        var roomId = Guid.NewGuid();
        var voteItemId = Guid.NewGuid();
        var voteItem = PlanningPokerVoteItem.Create("Test", roomId, voteItemId);
        voteItem.Reveal();

        _repo.GetVoteItemAsync(voteItemId, roomId, Arg.Any<CancellationToken>()).Returns(voteItem);

        await _sut.Invoking(s => s.VoteAsync(roomId, voteItemId, "5", Guid.NewGuid(), CancellationToken.None))
            .Should().ThrowAsync<BusinessRuleException>();
    }

    [Fact]
    public async Task GetDecksAsync_Should_Return_Decks()
    {
        var decks = new List<PlanningPokerDeckDto>
        {
            new(Guid.NewGuid(), "fibonacci", true, []),
        };

        _repo.GetDecksAsync(Arg.Any<CancellationToken>()).Returns(decks);

        var result = await _sut.GetDecksAsync(CancellationToken.None);

        result.Should().BeEquivalentTo(decks);
    }

    [Fact]
    public async Task VoteAsync_Should_Create_New_Vote_When_None_Exists()
    {
        var roomId = Guid.NewGuid();
        var participantId = Guid.NewGuid();
        var voteItemId = Guid.NewGuid();
        var voteItem = PlanningPokerVoteItem.Create("Item 1", roomId, voteItemId);
        var tx = Substitute.For<IDbContextTransaction>();

        _stateBuilder.BuildStateAsync(roomId, participantId, Arg.Any<CancellationToken>())
            .Returns(new RoomStateDto(roomId, "Test", DateTimeOffset.UtcNow, [], [], participantId, Guid.NewGuid(), false));
        _repo.GetVoteItemAsync(voteItemId, roomId, Arg.Any<CancellationToken>()).Returns(voteItem);
        _uow.BeginTransactionAsync(Arg.Any<CancellationToken>()).Returns(tx);
        _repo.GetVoteAsync(voteItemId, participantId, Arg.Any<CancellationToken>())
            .Returns((PlanningPokerVote?)null);

        await _sut.VoteAsync(roomId, voteItemId, "8", participantId, CancellationToken.None);

        await _repo.Received(1).LockVoteItemAsync(voteItemId, Arg.Any<CancellationToken>());
        await _repo.Received(1).AddVoteAsync(Arg.Is<PlanningPokerVote>(v => v!.Value == "8" && v!.ParticipantId == participantId), Arg.Any<CancellationToken>());
        await _uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
        await tx.Received(1).CommitAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task RevealVotesAsync_Should_Mark_Item_As_Revealed()
    {
        var roomId = Guid.NewGuid();
        var participantId = Guid.NewGuid();
        var voteItemId = Guid.NewGuid();
        var voteItem = PlanningPokerVoteItem.Create("Item 1", roomId, voteItemId);

        _stateBuilder.BuildStateAsync(roomId, participantId, Arg.Any<CancellationToken>())
            .Returns(new RoomStateDto(roomId, "Test", DateTimeOffset.UtcNow, [], [], participantId, Guid.NewGuid(), false));
        _repo.GetVoteItemAsync(voteItemId, roomId, Arg.Any<CancellationToken>()).Returns(voteItem);

        await _sut.RevealVotesAsync(roomId, voteItemId, participantId, CancellationToken.None);

        voteItem.IsRevealed.Should().BeTrue();
        await _uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ResetVotesAsync_Should_Clear_Votes_And_Unreveal()
    {
        var roomId = Guid.NewGuid();
        var participantId = Guid.NewGuid();
        var voteItemId = Guid.NewGuid();
        var voteItem = PlanningPokerVoteItem.Create("Item 1", roomId, voteItemId);

        _stateBuilder.BuildStateAsync(roomId, participantId, Arg.Any<CancellationToken>())
            .Returns(new RoomStateDto(roomId, "Test", DateTimeOffset.UtcNow, [], [], participantId, Guid.NewGuid(), false));
        _repo.GetVoteItemAsync(voteItemId, roomId, Arg.Any<CancellationToken>()).Returns(voteItem);

        await _sut.ResetVotesAsync(roomId, voteItemId, participantId, CancellationToken.None);

        voteItem.IsRevealed.Should().BeFalse();
        await _repo.Received(1).DeleteVotesForItemAsync(voteItemId, Arg.Any<CancellationToken>());
        await _uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}

public sealed class VoteProjectionTests
{
    [Fact]
    public void ProjectVote_Should_Return_Own_Vote_When_Not_Revealed()
    {
        var participantId = Guid.NewGuid();
        var vote = PlanningPokerVote.Create(participantId, "5", DateTimeOffset.UtcNow);
        vote.Participant = new PlanningPokerRoomParticipant
        {
            Id = participantId,
            DisplayName = "Alice",
        };

        var result = VoteProjection.ProjectVote(vote, participantId, isRevealed: false);

        result.ParticipantId.Should().Be(participantId);
        result.ParticipantName.Should().Be("Alice");
        result.Value.Should().Be("5");
    }

    [Fact]
    public void ProjectVote_Should_Hide_Other_Vote_When_Not_Revealed()
    {
        var ownId = Guid.NewGuid();
        var otherId = Guid.NewGuid();
        var vote = PlanningPokerVote.Create(otherId, "8", DateTimeOffset.UtcNow);
        vote.Participant = new PlanningPokerRoomParticipant
        {
            Id = otherId,
            DisplayName = "Bob",
        };

        var result = VoteProjection.ProjectVote(vote, ownId, isRevealed: false);

        result.ParticipantId.Should().Be(otherId);
        result.ParticipantName.Should().Be("Bob");
        result.Value.Should().BeNull();
    }

    [Fact]
    public void ProjectVote_Should_Show_All_Votes_When_Revealed()
    {
        var ownId = Guid.NewGuid();
        var otherId = Guid.NewGuid();
        var vote = PlanningPokerVote.Create(otherId, "8", DateTimeOffset.UtcNow);
        vote.Participant = new PlanningPokerRoomParticipant
        {
            Id = otherId,
            DisplayName = "Bob",
        };

        var result = VoteProjection.ProjectVote(vote, ownId, isRevealed: true);

        result.ParticipantId.Should().Be(otherId);
        result.ParticipantName.Should().Be("Bob");
        result.Value.Should().Be("8");
    }
}
