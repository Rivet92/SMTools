using FluentAssertions;
using NSubstitute;
using SMTools.Abstractions;
using SMTools.Abstractions.Exceptions;
using SMTools.Retro.Data;
using SMTools.Retro.DTOs.Hubs;
using SMTools.Retro.Models;
using SMTools.Retro.Services;

namespace SMToolsBackend.Tests.Unit.Services;

public sealed class RetroVoteServiceTests
{
    private readonly IRetroRepository _repo = Substitute.For<IRetroRepository>();
    private readonly IStateBuilder<RetroRoomStateDto> _stateBuilder = Substitute.For<IStateBuilder<RetroRoomStateDto>>();
    private readonly IUnitOfWork<RetroDbContext> _uow = Substitute.For<IUnitOfWork<RetroDbContext>>();
    private readonly RetroVoteService _sut;

    public RetroVoteServiceTests()
    {
        _stateBuilder.BuildStateAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(new RetroRoomStateDto(Guid.Empty, string.Empty, DateTimeOffset.MinValue, "Gathering", Guid.Empty, [], [], [], [], [], Guid.Empty, false));
        _sut = new RetroVoteService(_repo, _stateBuilder, _uow);
    }

    [Fact]
    public async Task AddVotePointAsync_Should_Throw_When_Not_Voting_Phase()
    {
        var roomId = Guid.NewGuid();
        var room = new RetroRoom
        {
            Id = roomId,
        };
        _repo.GetRoomAsync(roomId, Arg.Any<CancellationToken>()).Returns(room);

        await _sut.Invoking(s => s.AddVotePointAsync(roomId, Guid.NewGuid(), Guid.NewGuid(), CancellationToken.None))
            .Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("Voting is only allowed during the voting phase.");
    }

    [Fact]
    public async Task RemoveVotePointAsync_Should_Throw_When_Not_Voting_Phase()
    {
        var roomId = Guid.NewGuid();
        var room = new RetroRoom
        {
            Id = roomId,
        };
        _repo.GetRoomAsync(roomId, Arg.Any<CancellationToken>()).Returns(room);

        await _sut.Invoking(s => s.RemoveVotePointAsync(roomId, Guid.NewGuid(), Guid.NewGuid(), CancellationToken.None))
            .Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("Voting phase required to remove vote points.");
    }
}
