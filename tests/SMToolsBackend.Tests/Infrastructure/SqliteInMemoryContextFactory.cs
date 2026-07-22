using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace SMToolsBackend.Tests.Infrastructure;

public static class SqliteInMemoryContextFactory
{
    public static (SqliteConnection Connection, TDbContext Context) Create<TDbContext>()
        where TDbContext : DbContext
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();

        var options = new DbContextOptionsBuilder<TDbContext>()
            .UseSqlite(connection)
            .Options;

        var context = (TDbContext)Activator.CreateInstance(typeof(TDbContext), options)!;
        context.Database.EnsureCreated();

        return (connection, context);
    }

    public static (SqliteConnection Connection, TDbContext Context) CreateWithSuffix<TDbContext>(string suffix)
        where TDbContext : DbContext
    {
        var connection = new SqliteConnection($"DataSource=file:mem-{typeof(TDbContext).Name}-{suffix}?mode=memory&cache=shared");
        connection.Open();

        var options = new DbContextOptionsBuilder<TDbContext>()
            .UseSqlite(connection)
            .Options;

        var context = (TDbContext)Activator.CreateInstance(typeof(TDbContext), options)!;
        context.Database.EnsureCreated();

        return (connection, context);
    }
}
