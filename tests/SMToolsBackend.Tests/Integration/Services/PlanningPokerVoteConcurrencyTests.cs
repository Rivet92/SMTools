using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SMTools.Abstractions;
using SMTools.PlanningPoker.Data;
using SMTools.PlanningPoker.DTOs.Hubs;
using SMTools.PlanningPoker.Models;
using SMTools.PlanningPoker.Services;

namespace SMToolsBackend.Tests.Integration.Services;

public sealed class PlanningPokerVoteConcurrencyTests : IDisposable
{
    private readonly string _dbName;
    private readonly SqliteConnection _keepAliveConnection;
    private readonly Guid _deckId;
    private readonly Guid _roomId;
    private readonly Guid _participantId;
    private readonly Guid _voteItemId;

    public PlanningPokerVoteConcurrencyTests()
    {
        _dbName = $"pp-concur-{Guid.NewGuid()}";
        _keepAliveConnection = new SqliteConnection($"DataSource=file:{_dbName}?mode=memory&cache=shared");
        _keepAliveConnection.Open();

        _deckId = Guid.NewGuid();
        _roomId = Guid.NewGuid();
        _participantId = Guid.NewGuid();
        _voteItemId = Guid.NewGuid();

        using var db = CreateDbContext();
        db.Database.EnsureCreated();

        db.PlanningPokerDecks.Add(new PlanningPokerDeck
        {
            Id = _deckId,
            Key = "test",
            IsDefault = true,
        });

        db.PlanningPokerRooms.Add(new PlanningPokerRoom
        {
            Id = _roomId,
            Title = "Concurrent Test",
            CreatedAt = DateTimeOffset.UtcNow,
            DeckId = _deckId,
        });

        db.PlanningPokerRoomParticipants.Add(new PlanningPokerRoomParticipant
        {
            Id = _participantId,
            RoomId = _roomId,
            DisplayName = "Test User",
            ConnectionId = "conn-1",
            IsOwner = true,
            IsConnected = true,
            JoinedAt = DateTimeOffset.UtcNow,
        });

        db.PlanningPokerVoteItems.Add(PlanningPokerVoteItem.Create("Item 1", _roomId, _voteItemId));

        db.SaveChanges();
    }

    public void Dispose()
    {
        _keepAliveConnection.Dispose();
    }

    [Fact]
    public async Task Concurrent_Votes_For_Same_Participant_And_Item_Should_Result_In_Single_Vote()
    {
        var service1 = CreateService();
        var service2 = CreateService();

        var task1 = service1.VoteAsync(_roomId, _voteItemId, "5", _participantId, CancellationToken.None);
        var task2 = service2.VoteAsync(_roomId, _voteItemId, "8", _participantId, CancellationToken.None);

        // Both tasks may succeed (SQLite without FOR UPDATE) or one may fail with
        // a unique constraint violation (PostgreSQL with FOR UPDATE).
        // In either case the business invariant holds: only one vote is stored.
        await Task.WhenAll(task1, task2).ContinueWith(_ => { });

        using var verifyDb = CreateDbContext();
        var votes = await verifyDb.PlanningPokerVotes
            .Where(v => v.VoteItemId == _voteItemId)
            .ToListAsync();

        votes.Should().HaveCount(1);
    }

    private PlanningPokerVoteItemService CreateService()
    {
        var options = new DbContextOptionsBuilder<PlanningPokerDbContext>()
            .UseSqlite($"DataSource=file:{_dbName}?mode=memory&cache=shared")
            .Options;
        var db = new PlanningPokerDbContext(options);
        var repo = new PlanningPokerRepository(db);
        var uow = new UnitOfWork<PlanningPokerDbContext>(db);
        var stateBuilder = new PlanningPokerStateBuilder(repo);
        return new PlanningPokerVoteItemService(repo, uow, stateBuilder);
    }

    private PlanningPokerDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<PlanningPokerDbContext>()
            .UseSqlite($"DataSource=file:{_dbName}?mode=memory&cache=shared")
            .Options;
        return new PlanningPokerDbContext(options);
    }
}
