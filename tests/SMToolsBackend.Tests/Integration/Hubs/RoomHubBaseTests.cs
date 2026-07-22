using System.Data.Common;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NSubstitute;
using SMTools.Abstractions;
using SMTools.Abstractions.Exceptions;
using SMTools.Abstractions.Hubs;
using SMTools.Abstractions.ValueObjects;
using SMToolsBackend.Tests.Infrastructure;

namespace SMToolsBackend.Tests.Integration.Hubs;

public sealed class TestRoomHub : RoomHubBase<TestRoom, TestParticipant, TestRoomState, TestApplicationDbContext>
{
    public bool RoomClosedWasCalled { get; private set; }

    public TestRoomHub(TestApplicationDbContext db, IUnitOfWork<TestApplicationDbContext> uow, IConfiguration configuration, ILogger<TestRoomHub> logger) : base(db, uow, configuration, logger) { }

    protected override Task<TestRoomState> BuildRoomStateAsync(Guid roomId, Guid ownParticipantId, CancellationToken cancellationToken)
    {
        return Task.FromResult(new TestRoomState(roomId, "test", DateTimeOffset.UtcNow, [], ownParticipantId, false));
    }

    protected override void OnRoomClosed(Guid roomId)
    {
        RoomClosedWasCalled = true;
        base.OnRoomClosed(roomId);
    }
}

public sealed class RoomHubBaseTests
{
    [Fact]
    public async Task JoinRoom_Should_Throw_When_Room_Not_Found()
    {
        await using var f = await RoomTestFixture.CreateAsync();

        var act = () => f.Hub.JoinRoom(Guid.NewGuid(), null);

        await act.Should().ThrowAsync<BusinessRuleException>().Where(e => e.Message.Contains("RoomNotActive"));
    }

    [Fact]
    public async Task JoinRoom_WithValidRoom_ShouldSucceed()
    {
        await using var f = await RoomTestFixture.CreateAsync();
        f.Room = new TestRoom
        {
            Id = Guid.NewGuid(),
            Title = "Test Room",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestRooms.Add(f.Room);
        await f.Db.SaveChangesAsync();

        var state = await f.Hub.JoinRoom(f.Room.Id, null);

        state.Should().NotBeNull();
    }

    [Fact]
    public async Task JoinRoom_WithPassword_ShouldSucceed()
    {
        await using var f = await RoomTestFixture.CreateAsync();
        f.Room = new TestRoom
        {
            Id = Guid.NewGuid(),
            Title = "Test Room",
            CreatedAt = DateTimeOffset.UtcNow,
            PasswordHash = Password.Create("correct-password").Hash,
        };
        f.Db.TestRooms.Add(f.Room);
        await f.Db.SaveChangesAsync();

        var state = await f.Hub.JoinRoom(f.Room.Id, "correct-password");

        state.Should().NotBeNull();
    }

    [Fact]
    public async Task JoinRoom_WithWrongPassword_ShouldThrow()
    {
        await using var f = await RoomTestFixture.CreateAsync();
        f.Room = new TestRoom
        {
            Id = Guid.NewGuid(),
            Title = "Test Room",
            CreatedAt = DateTimeOffset.UtcNow,
            PasswordHash = Password.Create("correct-password").Hash,
        };
        f.Db.TestRooms.Add(f.Room);
        await f.Db.SaveChangesAsync();

        var act = () => f.Hub.JoinRoom(f.Room.Id, "wrong-password");

        await act.Should().ThrowAsync<InvalidPasswordException>();
    }

    [Fact]
    public async Task JoinRoom_AsExistingUser_ShouldReconnect()
    {
        var userId = Guid.NewGuid();
        await using var f = await RoomTestFixture.CreateAsync(setCaller: false);
        f.SetCallerUser(userId, "ExistingUser", "conn-existing");
        f.Room = new TestRoom
        {
            Id = Guid.NewGuid(),
            Title = "Test Room",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestRooms.Add(f.Room);
        var existingParticipant = new TestParticipant
        {
            Id = Guid.NewGuid(),
            RoomId = f.Room.Id,
            ConnectionId = "old-connection",
            DisplayName = "ExistingUser",
            UserId = userId,
            IsOwner = false,
            IsAdmin = false,
            IsConnected = true,
            HasLeft = false,
            JoinedAt = DateTimeOffset.UtcNow.AddMinutes(-5),
        };
        f.Db.TestParticipants.Add(existingParticipant);
        await f.Db.SaveChangesAsync();

        var state = await f.Hub.JoinRoom(f.Room.Id, null);

        state.Should().NotBeNull();
        var reloaded = await f.Db.TestParticipants.FindAsync([existingParticipant.Id]);
        reloaded!.ConnectionId.Should().Be("conn-existing");
        reloaded.IsConnected.Should().BeTrue();
    }

    [Fact]
    public async Task LeaveRoom_ShouldMarkParticipantAsDisconnected()
    {
        var connId = "conn-leave";
        await using var f = await RoomTestFixture.CreateAsync(setCaller: false);
        f.SetCaller("conn-leave", "LeavingUser");
        f.Room = new TestRoom
        {
            Id = Guid.NewGuid(),
            Title = "Test Room",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestRooms.Add(f.Room);
        var participant = new TestParticipant
        {
            Id = Guid.NewGuid(),
            RoomId = f.Room.Id,
            ConnectionId = connId,
            DisplayName = "LeavingUser",
            IsOwner = true,
            IsConnected = true,
            HasLeft = false,
            JoinedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestParticipants.Add(participant);
        await f.Db.SaveChangesAsync();

        await f.Hub.LeaveRoom(f.Room.Id);

        var reloaded = await f.Db.TestParticipants.FindAsync([participant.Id]);
        reloaded!.IsConnected.Should().BeFalse();
    }

    [Fact]
    public async Task LeaveRoom_ShouldTriggerRoomClosed_WhenNoParticipantsRemain()
    {
        var connId = "conn-only";
        await using var f = await RoomTestFixture.CreateAsync(setCaller: false);
        f.SetCaller(connId, "SoloUser");
        f.Room = new TestRoom
        {
            Id = Guid.NewGuid(),
            Title = "Test Room",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestRooms.Add(f.Room);
        var participant = new TestParticipant
        {
            Id = Guid.NewGuid(),
            RoomId = f.Room.Id,
            ConnectionId = connId,
            DisplayName = "SoloUser",
            IsOwner = true,
            IsConnected = true,
            HasLeft = false,
            JoinedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestParticipants.Add(participant);
        await f.Db.SaveChangesAsync();

        await f.Hub.LeaveRoom(f.Room.Id);

        (f.Hub as TestRoomHub).RoomClosedWasCalled.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateRoomPassword_AsOwner_ShouldUpdate()
    {
        await using var f = await RoomTestFixture.CreateAsync();
        f.Room = new TestRoom
        {
            Id = Guid.NewGuid(),
            Title = "Test Room",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestRooms.Add(f.Room);
        var owner = new TestParticipant
        {
            Id = Guid.NewGuid(),
            RoomId = f.Room.Id,
            ConnectionId = "owner-conn",
            DisplayName = "Owner",
            IsOwner = true,
            IsConnected = true,
            HasLeft = false,
            JoinedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestParticipants.Add(owner);
        await f.Db.SaveChangesAsync();
        f.SetCallerContext(owner);

        await f.Hub.UpdateRoomPassword(f.Room.Id, "new-password");

        var reloadedRoom = await f.Db.TestRooms.FindAsync([f.Room.Id]);
        reloadedRoom!.PasswordHash.Should().NotBeNull();
        Password.Verify(reloadedRoom.PasswordHash, "new-password").Should().BeTrue();
    }

    [Fact]
    public async Task UpdateRoomPassword_AsNonOwner_ShouldThrow()
    {
        await using var f = await RoomTestFixture.CreateAsync();
        f.Room = new TestRoom
        {
            Id = Guid.NewGuid(),
            Title = "Test Room",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestRooms.Add(f.Room);
        var owner = new TestParticipant
        {
            Id = Guid.NewGuid(),
            RoomId = f.Room.Id,
            ConnectionId = "owner-conn",
            DisplayName = "Owner",
            IsOwner = true,
            IsConnected = true,
            HasLeft = false,
            JoinedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestParticipants.Add(owner);
        var nonOwner = new TestParticipant
        {
            Id = Guid.NewGuid(),
            RoomId = f.Room.Id,
            ConnectionId = "non-owner-conn",
            DisplayName = "NonOwner",
            IsOwner = false,
            IsConnected = true,
            HasLeft = false,
            JoinedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestParticipants.Add(nonOwner);
        await f.Db.SaveChangesAsync();
        f.SetCallerContext(nonOwner);

        var act = () => f.Hub.UpdateRoomPassword(f.Room.Id, "new-password");

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task MakeAdmin_AsOwner_ShouldSucceed()
    {
        await using var f = await RoomTestFixture.CreateAsync();
        f.Room = new TestRoom
        {
            Id = Guid.NewGuid(),
            Title = "Test Room",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestRooms.Add(f.Room);
        var owner = new TestParticipant
        {
            Id = Guid.NewGuid(),
            RoomId = f.Room.Id,
            ConnectionId = "owner-conn",
            DisplayName = "Owner",
            IsOwner = true,
            IsConnected = true,
            HasLeft = false,
            JoinedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestParticipants.Add(owner);
        var target = new TestParticipant
        {
            Id = Guid.NewGuid(),
            RoomId = f.Room.Id,
            ConnectionId = "target-conn",
            DisplayName = "Target",
            IsOwner = false,
            IsAdmin = false,
            IsConnected = true,
            HasLeft = false,
            JoinedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestParticipants.Add(target);
        await f.Db.SaveChangesAsync();
        f.SetCallerContext(owner);

        await f.Hub.MakeAdmin(f.Room.Id, target.Id);

        var reloaded = await f.Db.TestParticipants.FindAsync([target.Id]);
        reloaded!.IsAdmin.Should().BeTrue();
    }

    [Fact]
    public async Task MakeAdmin_AsNonOwner_ShouldThrow()
    {
        await using var f = await RoomTestFixture.CreateAsync();
        f.Room = new TestRoom
        {
            Id = Guid.NewGuid(),
            Title = "Test Room",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestRooms.Add(f.Room);
        var owner = new TestParticipant
        {
            Id = Guid.NewGuid(),
            RoomId = f.Room.Id,
            ConnectionId = "owner-conn",
            DisplayName = "Owner",
            IsOwner = true,
            IsConnected = true,
            HasLeft = false,
            JoinedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestParticipants.Add(owner);
        var nonOwner = new TestParticipant
        {
            Id = Guid.NewGuid(),
            RoomId = f.Room.Id,
            ConnectionId = "non-owner-conn",
            DisplayName = "NonOwner",
            IsOwner = false,
            IsConnected = true,
            HasLeft = false,
            JoinedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestParticipants.Add(nonOwner);
        var target = new TestParticipant
        {
            Id = Guid.NewGuid(),
            RoomId = f.Room.Id,
            ConnectionId = "target-conn",
            DisplayName = "Target",
            IsOwner = false,
            IsAdmin = false,
            IsConnected = true,
            HasLeft = false,
            JoinedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestParticipants.Add(target);
        await f.Db.SaveChangesAsync();
        f.SetCallerContext(nonOwner);

        var act = () => f.Hub.MakeAdmin(f.Room.Id, target.Id);

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task MakeAdmin_OfOwner_ShouldThrow()
    {
        await using var f = await RoomTestFixture.CreateAsync();
        f.Room = new TestRoom
        {
            Id = Guid.NewGuid(),
            Title = "Test Room",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestRooms.Add(f.Room);
        var owner = new TestParticipant
        {
            Id = Guid.NewGuid(),
            RoomId = f.Room.Id,
            ConnectionId = "owner-conn",
            DisplayName = "Owner",
            IsOwner = true,
            IsConnected = true,
            HasLeft = false,
            JoinedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestParticipants.Add(owner);
        await f.Db.SaveChangesAsync();
        f.SetCallerContext(owner);

        var act = () => f.Hub.MakeAdmin(f.Room.Id, owner.Id);

        await act.Should().ThrowAsync<BusinessRuleException>().WithMessage("Cannot change the owner's role.");
    }

    [Fact]
    public async Task RemoveAdmin_AsOwner_ShouldSucceed()
    {
        await using var f = await RoomTestFixture.CreateAsync();
        f.Room = new TestRoom
        {
            Id = Guid.NewGuid(),
            Title = "Test Room",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestRooms.Add(f.Room);
        var owner = new TestParticipant
        {
            Id = Guid.NewGuid(),
            RoomId = f.Room.Id,
            ConnectionId = "owner-conn",
            DisplayName = "Owner",
            IsOwner = true,
            IsConnected = true,
            HasLeft = false,
            JoinedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestParticipants.Add(owner);
        var admin = new TestParticipant
        {
            Id = Guid.NewGuid(),
            RoomId = f.Room.Id,
            ConnectionId = "admin-conn",
            DisplayName = "Admin",
            IsOwner = false,
            IsAdmin = true,
            IsConnected = true,
            HasLeft = false,
            JoinedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestParticipants.Add(admin);
        await f.Db.SaveChangesAsync();
        f.SetCallerContext(owner);

        await f.Hub.RemoveAdmin(f.Room.Id, admin.Id);

        var reloaded = await f.Db.TestParticipants.FindAsync([admin.Id]);
        reloaded!.IsAdmin.Should().BeFalse();
    }

    [Fact]
    public async Task RemoveAdmin_AsNonOwner_ShouldThrow()
    {
        await using var f = await RoomTestFixture.CreateAsync();
        f.Room = new TestRoom
        {
            Id = Guid.NewGuid(),
            Title = "Test Room",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestRooms.Add(f.Room);
        var owner = new TestParticipant
        {
            Id = Guid.NewGuid(),
            RoomId = f.Room.Id,
            ConnectionId = "owner-conn",
            DisplayName = "Owner",
            IsOwner = true,
            IsConnected = true,
            HasLeft = false,
            JoinedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestParticipants.Add(owner);
        var nonOwner = new TestParticipant
        {
            Id = Guid.NewGuid(),
            RoomId = f.Room.Id,
            ConnectionId = "non-owner-conn",
            DisplayName = "NonOwner",
            IsOwner = false,
            IsConnected = true,
            HasLeft = false,
            JoinedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestParticipants.Add(nonOwner);
        var admin = new TestParticipant
        {
            Id = Guid.NewGuid(),
            RoomId = f.Room.Id,
            ConnectionId = "admin-conn",
            DisplayName = "Admin",
            IsOwner = false,
            IsAdmin = true,
            IsConnected = true,
            HasLeft = false,
            JoinedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestParticipants.Add(admin);
        await f.Db.SaveChangesAsync();
        f.SetCallerContext(nonOwner);

        var act = () => f.Hub.RemoveAdmin(f.Room.Id, admin.Id);

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task RemoveAdmin_OfOwner_ShouldThrow()
    {
        await using var f = await RoomTestFixture.CreateAsync();
        f.Room = new TestRoom
        {
            Id = Guid.NewGuid(),
            Title = "Test Room",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestRooms.Add(f.Room);
        var owner = new TestParticipant
        {
            Id = Guid.NewGuid(),
            RoomId = f.Room.Id,
            ConnectionId = "owner-conn",
            DisplayName = "Owner",
            IsOwner = true,
            IsConnected = true,
            HasLeft = false,
            JoinedAt = DateTimeOffset.UtcNow,
        };
        f.Db.TestParticipants.Add(owner);
        await f.Db.SaveChangesAsync();
        f.SetCallerContext(owner);

        var act = () => f.Hub.RemoveAdmin(f.Room.Id, owner.Id);

        await act.Should().ThrowAsync<BusinessRuleException>().WithMessage("Cannot change the owner's role.");
    }

    [Fact]
    public async Task RemoveParticipant_AsOwner_ShouldSucceed()
    {
        await using var f = await RemoveParticipantFixture.Create(true, false);

        var state = await f.Hub.RemoveParticipant(f.Room.Id, f.Target.Id);

        state.Should().NotBeNull();
    }

    [Fact]
    public async Task RemoveParticipant_AsAdmin_ShouldSucceed()
    {
        await using var f = await RemoveParticipantFixture.Create(false, false, callerIsAdmin: true);

        var state = await f.Hub.RemoveParticipant(f.Room.Id, f.Target.Id);

        state.Should().NotBeNull();
    }

    [Fact]
    public async Task RemoveParticipant_AsRegular_ShouldThrow()
    {
        await using var f = await RemoveParticipantFixture.Create(false, false);

        var act = () => f.Hub.RemoveParticipant(f.Room.Id, f.Target.Id);

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task RemoveParticipant_TargetIsOwner_ShouldThrow()
    {
        await using var f = await RemoveParticipantFixture.Create(true, false, targetIsOwner: true);

        var act = () => f.Hub.RemoveParticipant(f.Room.Id, f.Target.Id);

        await act.Should().ThrowAsync<BusinessRuleException>().WithMessage("Cannot remove the room owner.");
    }

    [Fact]
    public async Task RemoveParticipant_AdminTargetsAdmin_ShouldThrow()
    {
        await using var f = await RemoveParticipantFixture.Create(false, true, callerIsAdmin: true);

        var act = () => f.Hub.RemoveParticipant(f.Room.Id, f.Target.Id);

        await act.Should().ThrowAsync<BusinessRuleException>().WithMessage("An admin cannot remove another admin.");
    }

    [Fact]
    public async Task RemoveParticipant_TargetNotFound_ShouldThrow()
    {
        await using var f = await RemoveParticipantFixture.Create(true, false);

        var act = () => f.Hub.RemoveParticipant(f.Room.Id, Guid.NewGuid());

        await act.Should().ThrowAsync<ParticipantNotInRoomException>();
    }

    [Fact]
    public async Task RemoveParticipant_ShouldSetHasLeft()
    {
        await using var f = await RemoveParticipantFixture.Create(true, false);

        await f.Hub.RemoveParticipant(f.Room.Id, f.Target.Id);

        var reloadedTarget = await f.Db.TestParticipants.FindAsync([f.Target.Id]);
        reloadedTarget!.HasLeft.Should().BeTrue();
    }

    [Fact]
    public async Task RemoveParticipant_ShouldNotifyTarget_YouWereRemoved()
    {
        await using var f = await RemoveParticipantFixture.Create(true, false);

        await f.Hub.RemoveParticipant(f.Room.Id, f.Target.Id);

        await f.Clients.Client(f.Target.ConnectionId).Received(1)
            .SendCoreAsync("YouWereRemoved", Arg.Any<object?[]>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task RemoveParticipant_ShouldNotifyGroup_RoomUpdated()
    {
        await using var f = await RemoveParticipantFixture.Create(true, false);

        await f.Hub.RemoveParticipant(f.Room.Id, f.Target.Id);

        await f.Clients.Group(f.Room.Id.ToString()).Received(1)
            .SendCoreAsync("RoomUpdated", Arg.Any<object?[]>(), Arg.Any<CancellationToken>());
    }

    private sealed class RoomTestFixture : IAsyncDisposable
    {
        private DbConnection _connection = null!;
        private TestApplicationDbContext _db = null!;
        private bool _disposed;

        public TestApplicationDbContext Db => _db;
        public TestRoomHub Hub { get; private set; } = null!;
        public IHubCallerClients Clients { get; private set; } = null!;
        public TestRoom Room { get; set; } = null!;

        private RoomTestFixture() { }

        public static async Task<RoomTestFixture> CreateAsync(bool setCaller = true)
        {
            var fixture = new RoomTestFixture();
            (fixture._connection, fixture._db) = SqliteInMemoryContextFactory.Create<TestApplicationDbContext>();

            var configSection = Substitute.For<IConfigurationSection>();
            configSection.Value.Returns("10");
            var config = Substitute.For<IConfiguration>();
            config.GetSection("SignalR:ReconnectTimeoutSeconds").Returns(configSection);

            var uow = new UnitOfWork<TestApplicationDbContext>(fixture._db);
            var logger = Substitute.For<ILogger<TestRoomHub>>();
            fixture.Hub = new TestRoomHub(fixture._db, uow, config, logger);

            fixture.Clients = SignalRMockFactory.CreateClients();
            fixture.Hub.Clients = fixture.Clients;
            fixture.Hub.Groups = SignalRMockFactory.CreateGroupManager();
            fixture.Hub.Context = HubTestBase.CreateHubContext("default-conn", "DefaultUser", Guid.NewGuid());

            return fixture;
        }

        public void SetCaller(string connectionId, string displayName, Guid? userId = null)
        {
            userId ??= Guid.NewGuid();
            Hub.Context = HubTestBase.CreateHubContext(connectionId, displayName, userId.Value);
        }

        public void SetCallerUser(Guid userId, string displayName, string connectionId)
        {
            Hub.Context = HubTestBase.CreateHubContext(connectionId, displayName, userId);
        }

        public void SetCallerContext(TestParticipant participant)
        {
            Hub.Context = HubTestBase.CreateHubContext(
                participant.ConnectionId,
                participant.DisplayName,
                participant.UserId ?? Guid.NewGuid());
        }

        public async ValueTask DisposeAsync()
        {
            if (_disposed)
                return;
            _disposed = true;
            await _db.DisposeAsync();
            await _connection.DisposeAsync();
        }
    }

    private sealed class RemoveParticipantFixture : IAsyncDisposable
    {
        private DbConnection _connection = null!;
        private TestApplicationDbContext _db = null!;
        private bool _disposed;

        public TestApplicationDbContext Db => _db;
        public TestRoomHub Hub { get; private set; } = null!;
        public IHubCallerClients Clients { get; private set; } = null!;
        public TestRoom Room { get; private set; } = null!;
        public TestParticipant Caller { get; private set; } = null!;
        public TestParticipant Target { get; private set; } = null!;

        private RemoveParticipantFixture() { }

        public static async Task<RemoveParticipantFixture> Create(
            bool callerIsOwner,
            bool targetIsAdmin,
            bool callerIsAdmin = false,
            bool targetIsOwner = false,
            string callerConnectionId = "caller-conn",
            string targetConnectionId = "target-conn")
        {
            var fixture = new RemoveParticipantFixture();
            (fixture._connection, fixture._db) = SqliteInMemoryContextFactory.Create<TestApplicationDbContext>();

            fixture.Room = new TestRoom
            {
                Id = Guid.NewGuid(),
                Title = "Test Room",
                CreatedAt = DateTimeOffset.UtcNow,
            };
            fixture._db.TestRooms.Add(fixture.Room);

            fixture.Caller = new TestParticipant
            {
                Id = Guid.NewGuid(),
                RoomId = fixture.Room.Id,
                ConnectionId = callerConnectionId,
                DisplayName = "Caller",
                IsOwner = callerIsOwner,
                IsAdmin = callerIsAdmin,
                IsConnected = true,
                HasLeft = false,
                JoinedAt = DateTimeOffset.UtcNow,
            };
            fixture._db.TestParticipants.Add(fixture.Caller);

            fixture.Target = new TestParticipant
            {
                Id = Guid.NewGuid(),
                RoomId = fixture.Room.Id,
                ConnectionId = targetConnectionId,
                DisplayName = "Target",
                IsOwner = targetIsOwner,
                IsAdmin = targetIsAdmin,
                IsConnected = true,
                HasLeft = false,
                JoinedAt = DateTimeOffset.UtcNow,
            };
            fixture._db.TestParticipants.Add(fixture.Target);
            await fixture._db.SaveChangesAsync();

            var configSection = Substitute.For<IConfigurationSection>();
            configSection.Value.Returns("10");
            var config = Substitute.For<IConfiguration>();
            config.GetSection("SignalR:ReconnectTimeoutSeconds").Returns(configSection);

            var uow = new UnitOfWork<TestApplicationDbContext>(fixture._db);
            var logger = Substitute.For<ILogger<TestRoomHub>>();
            fixture.Hub = new TestRoomHub(fixture._db, uow, config, logger);

            fixture.Clients = SignalRMockFactory.CreateClients();
            fixture.Hub.Clients = fixture.Clients;

            fixture.Hub.Context = HubTestBase.CreateHubContext(callerConnectionId, "Caller", Guid.NewGuid());

            fixture.Hub.Groups = SignalRMockFactory.CreateGroupManager();

            return fixture;
        }

        public async ValueTask DisposeAsync()
        {
            if (_disposed)
                return;
            _disposed = true;
            await _db.DisposeAsync();
            await _connection.DisposeAsync();
        }
    }
}
