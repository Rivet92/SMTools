using Microsoft.EntityFrameworkCore;

namespace SMTools.Api.Data;

public sealed class AuditDbContext : DbContext
{
    public AuditDbContext(DbContextOptions<AuditDbContext> options)
        : base(options)
    {
    }

    public DbSet<AuditEntry> AuditEntries => Set<AuditEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<AuditEntry>(entity =>
        {
            entity.ToTable("AuditEntries", "audit");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Action).HasMaxLength(50);
            entity.Property(e => e.EntityType).HasMaxLength(200);
            entity.Property(e => e.EntityId).HasMaxLength(100);
            entity.Property(e => e.IpAddress).HasMaxLength(50);
            entity.HasIndex(e => e.EntityType);
            entity.HasIndex(e => new { e.Action, e.EntityType });
            entity.HasIndex(e => new { e.UserId, e.Timestamp })
                .IsDescending(false, true);
        });
    }
}
