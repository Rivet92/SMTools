using FluentAssertions;
using NSubstitute;
using SMTools.Abstractions;
using SMTools.Abstractions.Exceptions;
using SMTools.Retro.Data;
using SMTools.Retro.DTOs.Hubs;

using SMTools.Retro.Models;
using SMTools.Retro.Services;

namespace SMToolsBackend.Tests.Unit.Services;

public sealed class RetroCardServiceTests
{
    private readonly IRetroRepository _repo = Substitute.For<IRetroRepository>();
    private readonly IStateBuilder<RetroRoomStateDto> _stateBuilder = Substitute.For<IStateBuilder<RetroRoomStateDto>>();
    private readonly IUnitOfWork<RetroDbContext> _uow = Substitute.For<IUnitOfWork<RetroDbContext>>();
    private readonly RetroCardService _sut;

    public RetroCardServiceTests()
    {
        _stateBuilder.BuildStateAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(new RetroRoomStateDto(Guid.Empty, string.Empty, DateTimeOffset.MinValue, "Gathering", Guid.Empty, [], [], [], [], [], Guid.Empty, false));
        _sut = new RetroCardService(_repo, _stateBuilder, _uow);
    }

    [Fact]
    public async Task AddCardAsync_Should_Throw_When_Not_Gathering_Phase()
    {
        var roomId = Guid.NewGuid();
        var room = new RetroRoom
        {
            Id = roomId,
            TemplateId = Guid.NewGuid(),
        };
        room.TransitionTo(RetroPhase.Voting);

        _repo.GetRoomAsync(roomId, Arg.Any<CancellationToken>()).Returns(room);

        await _sut.Invoking(s => s.AddCardAsync(roomId, Guid.NewGuid(), "Content", Guid.NewGuid(), CancellationToken.None))
            .Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("Business rule 'CardNotInGatheringPhase' violated: Cards can only be added during the gathering phase.");
    }

    [Fact]
    public async Task AddCardAsync_Should_Add_Card_Successfully()
    {
        var roomId = Guid.NewGuid();
        var columnId = Guid.NewGuid();
        var participantId = Guid.NewGuid();
        var room = new RetroRoom
        {
            Id = roomId,
            TemplateId = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow,
        };
        _repo.GetRoomAsync(roomId, Arg.Any<CancellationToken>()).Returns(room);
        _repo.ColumnExistsAsync(columnId, room.TemplateId, Arg.Any<CancellationToken>()).Returns(true);
        _repo.GetParticipantsAsync(roomId, Arg.Any<CancellationToken>()).Returns([]);

        await _sut.AddCardAsync(roomId, columnId, "Great work!", participantId, CancellationToken.None);

        await _repo.Received(1).AddCardAsync(Arg.Is<RetroCard>(c => c!.Content == "Great work!" && c!.ColumnId == columnId), Arg.Any<CancellationToken>());
        await _uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CreateGroupFromCardsAsync_Should_Throw_When_Not_Grouping_Phase()
    {
        var roomId = Guid.NewGuid();
        var room = new RetroRoom { Id = roomId };

        _repo.GetRoomAsync(roomId, Arg.Any<CancellationToken>()).Returns(room);

        await _sut.Invoking(s => s.CreateGroupFromCardsAsync(roomId, "Group", Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), CancellationToken.None))
            .Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("Groups can only be created during the grouping phase.");
    }

    [Fact]
    public async Task CreateGroupFromCardsAsync_Should_Throw_When_Same_Card()
    {
        var roomId = Guid.NewGuid();
        var cardId = Guid.NewGuid();
        var room = new RetroRoom { Id = roomId };
        room.TransitionTo(RetroPhase.Grouping);
        var card = new RetroCard { Id = cardId, RoomId = roomId, Content = "A" };

        _repo.GetRoomAsync(roomId, Arg.Any<CancellationToken>()).Returns(room);
        _repo.GetCardAsync(cardId, roomId, Arg.Any<CancellationToken>()).Returns(card);

        await _sut.Invoking(s => s.CreateGroupFromCardsAsync(roomId, "Group", cardId, cardId, Guid.NewGuid(), CancellationToken.None))
            .Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("Cannot group a card with itself.");
    }

    [Fact]
    public async Task CreateGroupFromCardsAsync_Should_Create_Group()
    {
        var roomId = Guid.NewGuid();
        var card1Id = Guid.NewGuid();
        var card2Id = Guid.NewGuid();
        var room = new RetroRoom
        {
            Id = roomId,
            TemplateId = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow,
        };
        room.TransitionTo(RetroPhase.Grouping);
        var card1 = new RetroCard { Id = card1Id, RoomId = roomId, Content = "A" };
        var card2 = new RetroCard { Id = card2Id, RoomId = roomId, Content = "B" };

        _repo.GetRoomAsync(roomId, Arg.Any<CancellationToken>()).Returns(room);
        _repo.GetCardAsync(card1Id, roomId, Arg.Any<CancellationToken>()).Returns(card1);
        _repo.GetCardAsync(card2Id, roomId, Arg.Any<CancellationToken>()).Returns(card2);
        _repo.GetParticipantsAsync(roomId, Arg.Any<CancellationToken>()).Returns([]);

        await _sut.CreateGroupFromCardsAsync(roomId, "New Group", card1Id, card2Id, Guid.NewGuid(), CancellationToken.None);

        await _repo.Received(1).AddGroupAsync(Arg.Is<RetroCardGroup>(g => g!.Title == "New Group"), Arg.Any<CancellationToken>());
        await _uow.Received(3).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DeleteCardAsync_Should_Delete_And_Return_State()
    {
        var roomId = Guid.NewGuid();
        var cardId = Guid.NewGuid();
        var participantId = Guid.NewGuid();
        var card = new RetroCard { Id = cardId, RoomId = roomId, AuthorParticipantId = participantId, Content = "To delete" };
        var room = new RetroRoom
        {
            Id = roomId,
            TemplateId = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow,
        };

        _repo.GetCardAsync(cardId, roomId, Arg.Any<CancellationToken>()).Returns(card);
        _repo.GetRoomAsync(roomId, Arg.Any<CancellationToken>()).Returns(room);
        _repo.GetParticipantsAsync(roomId, Arg.Any<CancellationToken>()).Returns([]);

        await _sut.DeleteCardAsync(roomId, cardId, participantId, CancellationToken.None);

        await _repo.Received(1).DeleteVotesForCardAsync(cardId, Arg.Any<CancellationToken>());
        await _repo.Received(1).DeleteCardAsync(cardId, Arg.Any<CancellationToken>());
        await _uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
