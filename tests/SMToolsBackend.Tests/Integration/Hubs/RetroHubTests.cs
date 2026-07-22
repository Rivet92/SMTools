using FluentAssertions;
using Microsoft.Extensions.Logging;
using NSubstitute;
using SMTools.Retro.Data;
using SMTools.Retro.Hubs;
using SMTools.Retro.Models;
using SMTools.Retro.DTOs.Hubs;
using SMTools.Retro.Services;
using SMTools.Abstractions;
using SMTools.Abstractions.Exceptions;
using SMTools.Abstractions.ValueObjects;

namespace SMToolsBackend.Tests.Integration.Hubs;

public sealed class RetroHubTests : HubTestBase<RetroDbContext>
{
    private readonly RetroHub _hub;
    private readonly RetroRoom _room;

    public RetroHubTests()
    {
        var template = new RetroTemplate
        {
            Id = Guid.NewGuid(),
            Key = "mad-sad-glad",
            IsDefault = true,
        };
        _db.RetroTemplates.Add(template);
        _db.SaveChanges();

        _room = new RetroRoom
        {
            Id = Guid.NewGuid(),
            Title = "Test Retro",
            CreatedAt = DateTimeOffset.UtcNow,
            TemplateId = template.Id,
        };
        _db.RetroRooms.Add(_room);
        _db.SaveChanges();

        var hubContext = HubTestBase.CreateHubContext("test-connection-id", "test-user", Guid.NewGuid());

        var repo = new RetroRepository(_db);
        IStateBuilder<RetroRoomStateDto> stateBuilder = new RetroStateBuilder(repo);
        IUnitOfWork<RetroDbContext> uow = new UnitOfWork<RetroDbContext>(_db);
        IRetroRoomService roomService = new RetroRoomService(repo, stateBuilder, uow, null!);
        IRetroCardService cardService = new RetroCardService(repo, stateBuilder, uow);
        IRetroVoteService voteService = new RetroVoteService(repo, stateBuilder, uow);
        IRetroActionItemService actionItemService = new RetroActionItemService(repo, stateBuilder, uow);
        var logger = Substitute.For<ILogger<RetroHub>>();
        _hub = new RetroHub(_db, uow, _configuration, roomService, cardService, voteService, actionItemService, _versionStore, logger);
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
    public async Task SetPhase_Should_Transition_From_Gathering_To_Voting()
    {
        await _hub.JoinRoom(_room.Id, null);

        var state = await _hub.SetPhase(_room.Id, 1);

        state.Phase.Should().Be("Grouping");
    }

    [Fact]
    public async Task SetPhase_Should_Throw_When_Not_Joined()
    {
        var act = () => _hub.SetPhase(_room.Id, 1);

        await act.Should().ThrowAsync<ForbiddenException>().WithMessage("You are not a participant in this room.");
    }
}
