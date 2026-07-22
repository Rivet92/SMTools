using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using SMTools.Abstractions;
using SMTools.Abstractions.Exceptions;
using SMTools.Retro.Data;
using SMTools.Retro.DTOs.Hubs;
using SMTools.Retro.Models;
using SMTools.Retro.Services;

namespace SMToolsBackend.Tests.Integration.Services;

public sealed class RetroVoteConcurrencyTests : IDisposable
{
    private readonly string _dbName;
    private readonly SqliteConnection _keepAliveConnection;
    private readonly Guid _roomId;
    private readonly Guid _participantId;
    private readonly List<Guid> _cardIds;

    public RetroVoteConcurrencyTests()
    {
        _dbName = $"retro-concur-{Guid.NewGuid()}";
        _keepAliveConnection = new SqliteConnection($"DataSource=file:{_dbName}?mode=memory&cache=shared");
        _keepAliveConnection.Open();

        _roomId = Guid.NewGuid();
        _participantId = Guid.NewGuid();
        _cardIds = Enumerable.Range(0, 6).Select(_ => Guid.NewGuid()).ToList();

        using var db = CreateDbContext();
        db.Database.EnsureCreated();

        var template = new RetroTemplate
        {
            Id = Guid.NewGuid(),
            Key = "mad-sad-glad",
            IsDefault = true,
        };
        db.RetroTemplates.Add(template);

        var column = new RetroColumn
        {
            Id = Guid.NewGuid(),
            TemplateId = template.Id,
            Key = "mad",
            Color = "#ff0000",
            DisplayOrder = 1,
        };
        db.RetroColumns.Add(column);

        var room = new RetroRoom
        {
            Id = _roomId,
            Title = "Concurrent Retro Test",
            CreatedAt = DateTimeOffset.UtcNow,
            TemplateId = template.Id,
        };
        room.TransitionTo(RetroPhase.Voting);
        db.RetroRooms.Add(room);

        db.RetroRoomParticipants.Add(new RetroRoomParticipant
        {
            Id = _participantId,
            RoomId = _roomId,
            DisplayName = "Test User",
            ConnectionId = "conn-1",
            IsOwner = true,
            IsConnected = true,
            JoinedAt = DateTimeOffset.UtcNow,
        });

        foreach (var cardId in _cardIds)
        {
            db.RetroCards.Add(new RetroCard
            {
                Id = cardId,
                RoomId = _roomId,
                ColumnId = column.Id,
                Content = $"Card {cardId}",
                AuthorParticipantId = _participantId,
                CreatedAt = DateTimeOffset.UtcNow,
            });
        }

        db.SaveChanges();
    }

    public void Dispose()
    {
        _keepAliveConnection.Dispose();
    }

    [Fact]
    public async Task Concurrent_Votes_Should_Not_Exceed_Max_Vote_Limit()
    {
        var stateBuilder = Substitute.For<IStateBuilder<RetroRoomStateDto>>();
        stateBuilder.BuildStateAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(new RetroRoomStateDto(Guid.Empty, string.Empty, DateTimeOffset.MinValue, "Voting", Guid.Empty, [], [], [], [], [], Guid.Empty, false));

        var tasks = _cardIds.Select(cardId =>
        {
            var service = CreateService(stateBuilder);
            return service.AddVotePointAsync(_roomId, cardId, _participantId, CancellationToken.None);
        }).ToList();

        var results = new List<(bool Success, Exception? Exception)>();
        foreach (var task in tasks)
        {
            try
            {
                await task;
                results.Add((true, null));
            }
            catch (Exception ex)
            {
                results.Add((false, ex));
            }
        }

        var successCount = results.Count(r => r.Success);
        var exceptionCount = results.Count(r => r.Exception is not null);

        successCount.Should().Be(5);
        exceptionCount.Should().Be(1);

        if (exceptionCount > 0)
        {
            var ex = results.First(r => r.Exception is not null).Exception!;
            ex.Should().BeAssignableTo<BusinessRuleException>();
        }

        using var verifyDb = CreateDbContext();
        var votes = await verifyDb.RetroVotes
            .Where(v => v.RoomId == _roomId && v.ParticipantId == _participantId)
            .ToListAsync();

        var totalPoints = votes.Sum(v => v.Points);
        totalPoints.Should().Be(5);
    }

    private RetroVoteService CreateService(IStateBuilder<RetroRoomStateDto> stateBuilder)
    {
        var options = new DbContextOptionsBuilder<RetroDbContext>()
            .UseSqlite($"DataSource=file:{_dbName}?mode=memory&cache=shared")
            .Options;
        var db = new RetroDbContext(options);
        var repo = new RetroRepository(db);
        var uow = new UnitOfWork<RetroDbContext>(db);
        return new RetroVoteService(repo, stateBuilder, uow);
    }

    private RetroDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<RetroDbContext>()
            .UseSqlite($"DataSource=file:{_dbName}?mode=memory&cache=shared")
            .Options;
        return new RetroDbContext(options);
    }
}
