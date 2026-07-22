using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace SMTools.Abstractions;

public sealed class UnitOfWork<TDbContext> : IUnitOfWork<TDbContext>
    where TDbContext : DbContext
{
    private readonly TDbContext _context;

    public UnitOfWork(TDbContext context)
    {
        _context = context;
    }

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
        => _context.SaveChangesAsync(ct);

    public Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken ct = default)
        => _context.Database.BeginTransactionAsync(ct);
}
