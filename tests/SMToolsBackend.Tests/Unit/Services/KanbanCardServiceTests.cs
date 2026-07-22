using FluentAssertions;
using NSubstitute;
using SMTools.Abstractions;
using SMTools.Kanban.Data;
using SMTools.Kanban.DTOs.Hubs;
using SMTools.Abstractions.Exceptions;
using SMTools.Kanban.Models;
using SMTools.Kanban.Services;

namespace SMToolsBackend.Tests.Unit.Services;

public sealed class KanbanCardServiceTests
{
    private readonly IKanbanRepository _repo = Substitute.For<IKanbanRepository>();
    private readonly IStateBuilder<KanbanRoomStateDto> _stateBuilder = Substitute.For<IStateBuilder<KanbanRoomStateDto>>();
    private readonly IUnitOfWork<KanbanDbContext> _uow = Substitute.For<IUnitOfWork<KanbanDbContext>>();
    private readonly KanbanCardService _sut;

    public KanbanCardServiceTests()
    {
        _stateBuilder.BuildStateAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(new KanbanRoomStateDto(Guid.NewGuid(), "Test", DateTimeOffset.UtcNow, [], [], [], Guid.NewGuid(), false));
        _sut = new KanbanCardService(_repo, _stateBuilder, _uow);
    }

    [Fact]
    public async Task AddCardAsync_Should_Throw_When_Column_Not_Found()
    {
        var roomId = Guid.NewGuid();
        var columnId = Guid.NewGuid();

        _repo.GetColumnAsync(columnId, roomId, Arg.Any<CancellationToken>())
            .Returns((KanbanColumn?)null);

        await _sut.Invoking(s => s.AddCardAsync(roomId, columnId, "Title", null, Guid.NewGuid(), null, null, null, null, null, null, CancellationToken.None))
            .Should().ThrowAsync<NotFoundException<KanbanColumn>>();
    }

    [Fact]
    public async Task AddCardAsync_Should_Add_And_Return_State()
    {
        var roomId = Guid.NewGuid();
        var columnId = Guid.NewGuid();
        var participantId = Guid.NewGuid();
        var room = new KanbanRoom
        {
            Id = roomId,
            Title = "Test",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        var column = new KanbanColumn
        {
            Id = columnId,
            RoomId = roomId,
            Title = "To Do",
            DisplayOrder = 1,
        };

        _repo.GetColumnAsync(columnId, roomId, Arg.Any<CancellationToken>()).Returns(column);
        _repo.GetNextCardOrderAsync(columnId, Arg.Any<CancellationToken>()).Returns(0);

        var state = await _sut.AddCardAsync(roomId, columnId, "New Card", null, participantId, null, null, null, null, null, null, CancellationToken.None);

        await _repo.Received(1).AddCardAsync(Arg.Is<KanbanCard>(c => c!.Title == "New Card"), Arg.Any<CancellationToken>());
        await _uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DeleteCardAsync_Should_Delete_And_Return_State()
    {
        var roomId = Guid.NewGuid();
        var cardId = Guid.NewGuid();
        var callerParticipantId = Guid.NewGuid();
        var card = new KanbanCard
        {
            Id = cardId,
            RoomId = roomId,
            Title = "Card to delete",
            AuthorParticipantId = callerParticipantId,
        };
        var room = new KanbanRoom
        {
            Id = roomId,
            Title = "Test",
            CreatedAt = DateTimeOffset.UtcNow,
        };

        _repo.GetCardAsync(cardId, roomId, Arg.Any<CancellationToken>()).Returns(card);

        await _sut.DeleteCardAsync(roomId, cardId, callerParticipantId, CancellationToken.None);

        await _repo.Received(1).DeleteCardAsync(cardId);
        await _uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task MoveCardAsync_Should_Throw_When_Card_Not_Found()
    {
        _repo.GetCardAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns((KanbanCard?)null);

        await _sut.Invoking(s => s.MoveCardAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), 1, Guid.NewGuid(), CancellationToken.None))
            .Should().ThrowAsync<NotFoundException<KanbanCard>>();
    }

    [Fact]
    public async Task MoveCardAsync_Should_Throw_When_Column_Not_Found()
    {
        var card = new KanbanCard { Id = Guid.NewGuid(), RoomId = Guid.NewGuid(), AuthorParticipantId = Guid.NewGuid() };
        card.MoveToColumn(Guid.NewGuid(), 1);

        _repo.GetCardAsync(card.Id, card.RoomId, Arg.Any<CancellationToken>()).Returns(card);
        _repo.GetColumnAsync(Arg.Any<Guid>(), card.RoomId, Arg.Any<CancellationToken>())
            .Returns((KanbanColumn?)null);

        await _sut.Invoking(s => s.MoveCardAsync(card.RoomId, card.Id, Guid.NewGuid(), 1, Guid.NewGuid(), CancellationToken.None))
            .Should().ThrowAsync<NotFoundException<KanbanColumn>>();
    }

    [Fact]
    public async Task MoveCardAsync_Should_Move_Card_To_Different_Column()
    {
        var roomId = Guid.NewGuid();
        var sourceColumnId = Guid.NewGuid();
        var targetColumnId = Guid.NewGuid();
        var participantId = Guid.NewGuid();
        var card = new KanbanCard { Id = Guid.NewGuid(), RoomId = roomId, Title = "Card", AuthorParticipantId = participantId, DisplayOrder = 1 };
        card.MoveToColumn(sourceColumnId, 1);
        var sourceColumn = new KanbanColumn { Id = sourceColumnId, RoomId = roomId, Title = "Source", DisplayOrder = 1 };
        var targetColumn = new KanbanColumn { Id = targetColumnId, RoomId = roomId, Title = "Target", DisplayOrder = 2 };
        var room = new KanbanRoom { Id = roomId, Title = "Test", CreatedAt = DateTimeOffset.UtcNow };

        _repo.GetCardAsync(card.Id, roomId, Arg.Any<CancellationToken>()).Returns(card);
        _repo.GetColumnAsync(targetColumnId, roomId, Arg.Any<CancellationToken>()).Returns(targetColumn);
        _repo.GetCardsByColumnAsync(targetColumnId, Arg.Any<CancellationToken>()).Returns([]);
        _repo.GetCardsByColumnAsync(sourceColumnId, Arg.Any<CancellationToken>()).Returns([]);

        await _sut.MoveCardAsync(roomId, card.Id, targetColumnId, 1, participantId, CancellationToken.None);

        card.ColumnId.Should().Be(targetColumnId);
        card.DisplayOrder.Should().Be(1);
        await _uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateCardAsync_Should_Throw_When_Card_Not_Found()
    {
        _repo.GetCardAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns((KanbanCard?)null);

        await _sut.Invoking(s => s.UpdateCardAsync(Guid.NewGuid(), Guid.NewGuid(), "Title", null, null, null, null, null, null, null, Guid.NewGuid(), CancellationToken.None))
            .Should().ThrowAsync<NotFoundException<KanbanCard>>();
    }

    [Fact]
    public async Task UpdateCardAsync_Should_Update_Card()
    {
        var roomId = Guid.NewGuid();
        var cardId = Guid.NewGuid();
        var participantId = Guid.NewGuid();
        var card = new KanbanCard { Id = cardId, RoomId = roomId, Title = "Old Title", Description = "Old Desc", AuthorParticipantId = participantId, DisplayOrder = 1 };
        var room = new KanbanRoom { Id = roomId, Title = "Test", CreatedAt = DateTimeOffset.UtcNow };

        _repo.GetCardAsync(cardId, roomId, Arg.Any<CancellationToken>()).Returns(card);
        _repo.ParticipantExistsAsync(roomId, participantId, Arg.Any<CancellationToken>()).Returns(true);

        var state = await _sut.UpdateCardAsync(roomId, cardId, "New Title", "New Desc", participantId, null, null, null, null, null, participantId, CancellationToken.None);

        card.Title.Should().Be("New Title");
        card.Description.Should().Be("New Desc");
        await _uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
