using System.Data.Common;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NSubstitute;
using SMTools.Abstractions;
using SMTools.Abstractions.Hubs;
using SMToolsBackend.Tests.Infrastructure;

namespace SMToolsBackend.Tests.Integration.Hubs;

public sealed class TestApplicationDbContext : DbContext
{
    public TestApplicationDbContext(DbContextOptions options) : base(options) { }

    public DbSet<TestRoom> TestRooms => Set<TestRoom>();
    public DbSet<TestParticipant> TestParticipants => Set<TestParticipant>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<TestRoom>(e =>
        {
            e.HasKey(r => r.Id);
            e.Property(r => r.Title).HasMaxLength(256);
        });

        modelBuilder.Entity<TestParticipant>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.DisplayName).HasMaxLength(256);
            e.Property(p => p.ConnectionId).HasMaxLength(256);
        });
    }
}

public sealed record TestRoomState(
    Guid Id,
    string Title,
    DateTimeOffset CreatedAt,
    List<TestParticipantDto> Participants,
    Guid OwnParticipantId,
    bool HasPassword
) : IVersionedState
{
    public int Version { get; set; }
}

public sealed record TestParticipantDto(Guid Id, string DisplayName, bool IsOwner, bool IsAdmin, bool IsConnected);

public sealed class TestRoom : IRoom
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public string? PasswordHash { get; set; }
}

public sealed class TestParticipant : IRoomParticipant
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public string ConnectionId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public Guid? UserId { get; set; }
    public bool IsOwner { get; set; }
    public bool IsAdmin { get; set; }
    public bool IsConnected { get; set; }
    public bool HasLeft { get; set; }
    public DateTimeOffset JoinedAt { get; set; }
}

public abstract class HubTestBase : IDisposable
{
    protected readonly TestApplicationDbContext Db;
    protected readonly IHubCallerClients Clients;
    protected readonly IGroupManager Groups;
    protected readonly HubCallerContext HubContext;
    private readonly DbConnection _connection;
    protected HubTestBase()
    {
        (_connection, Db) = SqliteInMemoryContextFactory.Create<TestApplicationDbContext>();

        Clients = SignalRMockFactory.CreateClients();
        Groups = SignalRMockFactory.CreateGroupManager();

        HubContext = CreateHubContext("test-connection-id", "test-user", Guid.NewGuid());
    }

    public void Dispose()
    {
        Db.Dispose();
        _connection.Dispose();
    }

    protected void SetConnectionId(string connectionId)
    {
        HubContext.ConnectionId.Returns(connectionId);
    }

    public static HubCallerContext CreateHubContext(string connectionId, string displayName, Guid userId)
    {
        var httpContext = new DefaultHttpContext();
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new(ClaimTypes.Name, displayName),
            new(SMToolsClaimTypes.UserId, userId.ToString()),
        ], "test"));

        var ctx = Substitute.For<HubCallerContext>();
        ctx.ConnectionId.Returns(connectionId);
        ctx.ConnectionAborted.Returns(CancellationToken.None);
        ctx.GetHttpContext().Returns(httpContext);
        ctx.User.Returns(httpContext.User);
        return ctx;
    }
}

public abstract class HubTestBase<TDbContext> : IDisposable
    where TDbContext : DbContext
{
    protected readonly SqliteConnection _connection;
    protected readonly TDbContext _db;
    protected readonly IHubCallerClients _clients;
    protected readonly IGroupManager _groups;
    protected readonly IConfiguration _configuration;
    protected readonly IRoomVersionStore _versionStore;
    protected readonly ILogger _logger;

    protected HubTestBase()
    {
        (_connection, _db) = SqliteInMemoryContextFactory.Create<TDbContext>();

        _clients = SignalRMockFactory.CreateClients();
        _groups = SignalRMockFactory.CreateGroupManager();

        _configuration = Substitute.For<IConfiguration>();
        var configSection = Substitute.For<IConfigurationSection>();
        configSection.Value.Returns("10");
        _configuration.GetSection("SignalR:ReconnectTimeoutSeconds").Returns(configSection);

        _versionStore = Substitute.For<IRoomVersionStore>();
        _versionStore.NextVersion(Arg.Any<Guid>()).Returns(1);

        _logger = Substitute.For<ILogger>();
    }

    public virtual void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }

    protected void SetupCallerClient(string connectionId)
    {
        var callerClient = Substitute.For<IClientProxy>();
        _clients.Client(connectionId).Returns(callerClient);
    }

    protected void SetupGroupClient(string groupName)
    {
        var groupClient = Substitute.For<IClientProxy>();
        _clients.Group(groupName).Returns(groupClient);
        _clients.OthersInGroup(groupName).Returns(groupClient);
    }
}
