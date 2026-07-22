using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;
using SMTools.Abstractions;
using SMTools.Api.Data;

namespace SMToolsBackend.Tests.Unit;

public sealed class AuditInterceptorTests
{
    [Fact]
    public async Task Interceptor_WhenAuditDbFails_ShouldNotAbortBizSave()
    {
        var auditSuffix = Guid.NewGuid().ToString("N")[..8];
        var auditConnectionString = $"DataSource=file:mem-audit-{auditSuffix}?mode=memory&cache=shared";

        var auditOptions = new DbContextOptionsBuilder<AuditDbContext>()
            .UseSqlite(auditConnectionString)
            .Options;

        var auditContextFactory = new DisposedAuditDbContextFactory(auditOptions);

        var userAccessor = Substitute.For<ICurrentUserAccessor>();
        var logger = Substitute.For<ILogger<AuditInterceptor>>();
        var interceptor = new AuditInterceptor(userAccessor, auditContextFactory, logger);

        var bizOptions = new DbContextOptionsBuilder<TestBizContext>()
            .UseSqlite($"DataSource=file:mem-biz-{auditSuffix}?mode=memory&cache=shared")
            .AddInterceptors(interceptor)
            .Options;

        await using var bizContext = new TestBizContext(bizOptions);
        await bizContext.Database.EnsureCreatedAsync();
        bizContext.Items.Add(new TestItem { Name = "Test" });

        var act = () => bizContext.SaveChangesAsync();

        await act.Should().NotThrowAsync();
    }

    private sealed class DisposedAuditDbContextFactory : IDbContextFactory<AuditDbContext>
    {
        private readonly DbContextOptions<AuditDbContext> _options;

        public DisposedAuditDbContextFactory(DbContextOptions<AuditDbContext> options)
        {
            _options = options;
        }

        public AuditDbContext CreateDbContext()
        {
            var ctx = new AuditDbContext(_options);
            ctx.Dispose();
            return ctx;
        }

        public async ValueTask<AuditDbContext> CreateDbContextAsync(CancellationToken cancellationToken = default)
        {
            var ctx = new AuditDbContext(_options);
            await ctx.DisposeAsync();
            return ctx;
        }
    }

    private sealed class TestBizContext(DbContextOptions options) : DbContext(options)
    {
        public DbSet<TestItem> Items => Set<TestItem>();
    }

    private sealed class TestItem
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }
}
