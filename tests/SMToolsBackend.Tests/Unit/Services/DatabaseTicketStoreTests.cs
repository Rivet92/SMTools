using System.Data.Common;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using SMTools.Abstractions;
using SMTools.Identity.Auth;
using SMTools.Identity.Data;
using SMTools.Identity.Models;

namespace SMToolsBackend.Tests.Unit.Services;

public sealed class DatabaseTicketStoreTests : IDisposable
{
    private readonly DatabaseTicketStore _store;
    private readonly Guid _userId;
    private readonly TestIdentityDbContextFactory _factory;

    public DatabaseTicketStoreTests()
    {
        _userId = Guid.NewGuid();

        _factory = new TestIdentityDbContextFactory($"TestDb_{Guid.NewGuid()}");

        var dataProtectionProvider = new EphemeralDataProtectionProvider();
        _store = new DatabaseTicketStore(_factory, NullLogger<DatabaseTicketStore>.Instance, dataProtectionProvider);

        using var seedDb = _factory.CreateDbContext();
        seedDb.Users.Add(new User
        {
            Id = _userId,
            Provider = "google",
            ProviderUserId = "test-provider-id",
            Name = "Test User",
            Email = "test@test.local",
        });
        seedDb.UserSessions.Add(new UserSession
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            Ticket = "{}",
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(-1),
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-2),
        });
        seedDb.SaveChanges();
    }

    public void Dispose()
    {
        _factory.Dispose();
    }

    private IdentityDbContext CreateDbContext()
    {
        return _factory.CreateDbContext();
    }

    [Fact]
    public async Task StoreAsync_Should_Create_Session()
    {
        var ticket = CreateTicket(_userId);

        var key = await _store.StoreAsync(ticket);

        key.Should().NotBeNullOrEmpty();
        Guid.TryParseExact(key, "N", out _).Should().BeTrue();

        using var db = CreateDbContext();
        var sessions = db.UserSessions.Where(s => s.UserId == _userId && s.Ticket != "{}").ToList();
        sessions.Should().ContainSingle(s => s.Id.ToString("N") == key);
    }

    [Fact]
    public async Task StoreAsync_Should_Throw_When_No_UserId_Claim()
    {
        var identity = new ClaimsIdentity([new Claim(ClaimTypes.Name, "no-id")], CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, new AuthenticationProperties { ExpiresUtc = DateTimeOffset.UtcNow.AddDays(1) }, CookieAuthenticationDefaults.AuthenticationScheme);

        var act = () => _store.StoreAsync(ticket);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task RetrieveAsync_Should_Return_Ticket_When_Valid()
    {
        var originalTicket = CreateTicket(_userId);
        var key = await _store.StoreAsync(originalTicket);

        var retrieved = await _store.RetrieveAsync(key);

        retrieved.Should().NotBeNull();
        retrieved!.Principal.FindFirst(SMToolsClaimTypes.UserId)?.Value.Should().Be(_userId.ToString("N"));
    }

    [Fact]
    public async Task RetrieveAsync_Should_Return_Null_When_Key_Not_Found()
    {
        var result = await _store.RetrieveAsync(Guid.NewGuid().ToString("N"));

        result.Should().BeNull();
    }

    [Fact]
    public async Task RetrieveAsync_Should_Return_Null_When_Expired()
    {
        var ticket = CreateTicket(_userId, expiresUtc: DateTimeOffset.UtcNow.AddHours(-1));
        var key = await _store.StoreAsync(ticket);

        var result = await _store.RetrieveAsync(key);

        result.Should().BeNull();
    }

    [Fact]
    public async Task RetrieveAsync_Should_Return_Null_When_Invalid_Format()
    {
        var result = await _store.RetrieveAsync("not-a-guid");

        result.Should().BeNull();
    }

    [Fact]
    public async Task RenewAsync_Should_Update_Ticket()
    {
        var originalTicket = CreateTicket(_userId);
        var key = await _store.StoreAsync(originalTicket);

        var renewedTicket = CreateTicket(_userId, expiresUtc: DateTimeOffset.UtcNow.AddDays(14));
        await _store.RenewAsync(key, renewedTicket);

        var retrieved = await _store.RetrieveAsync(key);
        retrieved.Should().NotBeNull();
    }

    [Fact]
    public async Task RenewAsync_Should_Not_Throw_When_Key_Not_Found()
    {
        var ticket = CreateTicket(_userId);

        var act = () => _store.RenewAsync(Guid.NewGuid().ToString("N"), ticket);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task RemoveAsync_Should_Delete_Session()
    {
        var ticket = CreateTicket(_userId);
        var key = await _store.StoreAsync(ticket);

        await _store.RemoveAsync(key);

        using var db = CreateDbContext();
        var sessions = db.UserSessions.Where(s => s.UserId == _userId && s.Ticket != "{}").ToList();
        sessions.Should().BeEmpty();
    }

    [Fact]
    public async Task RemoveAsync_Should_Not_Throw_When_Key_Not_Found()
    {
        var act = () => _store.RemoveAsync(Guid.NewGuid().ToString("N"));

        await act.Should().NotThrowAsync();
    }

    private static AuthenticationTicket CreateTicket(Guid userId, DateTimeOffset? expiresUtc = null)
    {
        var claims = new List<Claim>
        {
            new(SMToolsClaimTypes.UserId, userId.ToString("N")),
            new(ClaimTypes.Name, "Test User"),
            new(ClaimTypes.Email, "test@test.local"),
        };
        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);
        var properties = new AuthenticationProperties
        {
            ExpiresUtc = expiresUtc ?? DateTimeOffset.UtcNow.AddDays(7),
            IssuedUtc = DateTimeOffset.UtcNow,
        };
        return new AuthenticationTicket(principal, properties, CookieAuthenticationDefaults.AuthenticationScheme);
    }
}

internal sealed class TestIdentityDbContextFactory : IDbContextFactory<IdentityDbContext>, IDisposable
{
    private readonly DbConnection _connection;
    private IdentityDbContext? _currentDb;

    public TestIdentityDbContextFactory(string dbName)
    {
        _connection = new SqliteConnection($"DataSource=file:{dbName}?mode=memory&cache=shared");
        _connection.Open();
    }

    public IdentityDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<IdentityDbContext>()
            .UseSqlite(_connection)
            .Options;
        _currentDb = new IdentityDbContext(options);
        _currentDb.Database.EnsureCreated();
        return _currentDb;
    }

    public Task<IdentityDbContext> CreateDbContextAsync(CancellationToken cancellationToken = default)
        => Task.FromResult(CreateDbContext());

    public void Dispose()
    {
        _currentDb?.Dispose();
        _connection.Dispose();
    }
}
