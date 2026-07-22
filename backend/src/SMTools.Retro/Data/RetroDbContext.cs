using Microsoft.EntityFrameworkCore;
using SMTools.Retro.Models;
using SMTools.Abstractions.ValueObjects;

namespace SMTools.Retro.Data;

public class RetroDbContext : DbContext
{
    public RetroDbContext(DbContextOptions<RetroDbContext> options) : base(options) { }

    public DbSet<RetroTemplate> RetroTemplates => Set<RetroTemplate>();
    public DbSet<RetroColumn> RetroColumns => Set<RetroColumn>();
    public DbSet<RetroRoom> RetroRooms => Set<RetroRoom>();
    public DbSet<RetroRoomParticipant> RetroRoomParticipants => Set<RetroRoomParticipant>();
    public DbSet<RetroCard> RetroCards => Set<RetroCard>();
    public DbSet<RetroCardGroup> RetroCardGroups => Set<RetroCardGroup>();
    public DbSet<RetroVote> RetroVotes => Set<RetroVote>();
    public DbSet<RetroActionItem> RetroActionItems => Set<RetroActionItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("retro");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(RetroDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
