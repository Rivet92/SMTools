using FluentAssertions;
using Microsoft.Extensions.Logging;
using NSubstitute;
using SMTools.Kanban.Data;
using SMTools.Kanban.Hubs;
using SMTools.Kanban.Models;
using SMTools.Kanban.DTOs.Hubs;
using SMTools.Kanban.Services;
using SMTools.Abstractions;
using SMTools.Abstractions.Exceptions;
using SMTools.Abstractions.ValueObjects;

namespace SMToolsBackend.Tests.Integration.Hubs;

public sealed class KanbanHubTests : HubTestBase<KanbanDbContext>
{
    private readonly KanbanHub _hub;
    private readonly KanbanRoom _room;

    public KanbanHubTests()
    {
        _room = new KanbanRoom
        {
            Id = Guid.NewGuid(),
            Title = "Test Kanban",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        _db.KanbanRooms.Add(_room);
        _db.SaveChanges();

        var hubContext = HubTestBase.CreateHubContext("test-connection-id", "test-user", Guid.NewGuid());

        var repo = new KanbanRepository(_db);
        IStateBuilder<KanbanRoomStateDto> stateBuilder = new KanbanStateBuilder(repo);
        IUnitOfWork<KanbanDbContext> uow = new UnitOfWork<KanbanDbContext>(_db);
        IKanbanRoomService roomService = new KanbanRoomService(repo, stateBuilder, uow, null!);
        IKanbanCardService cardService = new KanbanCardService(repo, stateBuilder, uow);
        IKanbanColumnService columnService = new KanbanColumnService(repo, stateBuilder, uow);
        IKanbanCommentService commentService = new KanbanCommentService(repo, stateBuilder, uow);
        var logger = Substitute.For<ILogger<KanbanHub>>();
        _hub = new KanbanHub(_db, uow, _configuration, roomService, cardService, columnService, commentService, _versionStore, logger);
        _hub.Clients = _clients;
        _hub.Groups = _groups;
        _hub.Context = hubContext;
    }

    [Fact]
    public async Task JoinRoom_Should_Create_Participant()
    {
        var state = await _hub.JoinRoom(_room.Id, null);

        state.Should().NotBeNull();
        state.Id.Should().Be(_room.Id);
        state.Participants.Should().ContainSingle(p => p.DisplayName == "test-user");
    }

    [Fact]
    public async Task AddColumn_Should_Create_Column()
    {
        await _hub.JoinRoom(_room.Id, null);

        var state = await _hub.AddColumn(_room.Id, "To Do", "Description");

        state.Columns.Should().ContainSingle(c => c.Title == "To Do");
    }

    [Fact]
    public async Task AddCard_Should_Create_Card()
    {
        await _hub.JoinRoom(_room.Id, null);

        var column = new KanbanColumn
        {
            Id = Guid.NewGuid(),
            RoomId = _room.Id,
            Title = "To Do",
            DisplayOrder = 0,
        };
        _db.KanbanColumns.Add(column);
        await _db.SaveChangesAsync();

        var state = await _hub.AddCard(_room.Id, column.Id, "Test Card", null, null,
            null, null, null, null, null);

        state.Cards.Should().ContainSingle(c => c.Title == "Test Card");
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

        var state = await _hub.JoinRoom(_room.Id, "secret12");

        state.Should().NotBeNull();
    }

    [Fact]
    public async Task AddComment_Should_Create_Comment_On_Card()
    {
        await _hub.JoinRoom(_room.Id, null);

        var columnState = await _hub.AddColumn(_room.Id, "To Do", null);
        var columnId = columnState.Columns.Single(c => c.Title == "To Do").Id;
        var cardState = await _hub.AddCard(_room.Id, columnId, "Test Card", null, null,
            null, null, null, null, null);
        var cardId = cardState.Cards.Single(c => c.Title == "Test Card").Id;

        var state = await _hub.AddComment(_room.Id, cardId, "This is a comment");

        state.Cards.Should().ContainSingle(c => c.Id == cardId)
            .Which.Comments.Should().ContainSingle(c => c.Content == "This is a comment");
    }

    [Fact]
    public async Task DeleteCard_Should_Remove_Card()
    {
        await _hub.JoinRoom(_room.Id, null);

        var columnState = await _hub.AddColumn(_room.Id, "To Do", null);
        var columnId = columnState.Columns.Single(c => c.Title == "To Do").Id;
        var cardState = await _hub.AddCard(_room.Id, columnId, "Test Card", null, null,
            null, null, null, null, null);
        var cardId = cardState.Cards.Single(c => c.Title == "Test Card").Id;

        var state = await _hub.DeleteCard(_room.Id, cardId);

        state.Cards.Should().NotContain(c => c.Id == cardId);
    }
}
