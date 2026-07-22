using FluentAssertions;
using NSubstitute;
using SMTools.Abstractions;
using SMTools.Retro.Data;
using SMTools.Retro.DTOs.Hubs;
using SMTools.Retro.Models;
using SMTools.Retro.Services;

namespace SMToolsBackend.Tests.Unit.Services;

public sealed class RetroActionItemServiceTests
{
    private readonly IRetroRepository _repo = Substitute.For<IRetroRepository>();
    private readonly IStateBuilder<RetroRoomStateDto> _stateBuilder = Substitute.For<IStateBuilder<RetroRoomStateDto>>();
    private readonly IUnitOfWork<RetroDbContext> _uow = Substitute.For<IUnitOfWork<RetroDbContext>>();
    private readonly RetroActionItemService _sut;

    public RetroActionItemServiceTests()
    {
        _stateBuilder.BuildStateAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(new RetroRoomStateDto(Guid.Empty, string.Empty, DateTimeOffset.MinValue, "Gathering", Guid.Empty, [], [], [], [], [], Guid.Empty, false));
        _sut = new RetroActionItemService(_repo, _stateBuilder, _uow);
    }

    [Fact]
    public async Task AddActionItemAsync_Should_Add_And_Save()
    {
        var roomId = Guid.NewGuid();
        var participantId = Guid.NewGuid();
        var room = new RetroRoom
        {
            Id = roomId,
            TemplateId = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow,
        };
        room.TransitionTo(RetroPhase.Actions);

        _repo.GetRoomAsync(roomId, Arg.Any<CancellationToken>()).Returns(room);
        _repo.GetParticipantsAsync(roomId, Arg.Any<CancellationToken>()).Returns([]);

        await _sut.AddActionItemAsync(roomId, "Action!", null, participantId, CancellationToken.None);

        await _repo.Received(1).AddActionItemAsync(Arg.Is<RetroActionItem>(a => a!.Content == "Action!"), Arg.Any<CancellationToken>());
        await _uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
