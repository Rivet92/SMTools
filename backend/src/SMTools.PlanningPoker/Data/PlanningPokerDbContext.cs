using Microsoft.EntityFrameworkCore;
using SMTools.PlanningPoker.Models;
using SMTools.Abstractions.ValueObjects;

namespace SMTools.PlanningPoker.Data;

public class PlanningPokerDbContext : DbContext
{
    public PlanningPokerDbContext(DbContextOptions<PlanningPokerDbContext> options) : base(options) { }

    public DbSet<PlanningPokerDeck> PlanningPokerDecks => Set<PlanningPokerDeck>();
    public DbSet<PlanningPokerCard> PlanningPokerCards => Set<PlanningPokerCard>();
    public DbSet<PlanningPokerRoom> PlanningPokerRooms => Set<PlanningPokerRoom>();
    public DbSet<PlanningPokerRoomParticipant> PlanningPokerRoomParticipants => Set<PlanningPokerRoomParticipant>();
    public DbSet<PlanningPokerVoteItem> PlanningPokerVoteItems => Set<PlanningPokerVoteItem>();
    public DbSet<PlanningPokerVote> PlanningPokerVotes => Set<PlanningPokerVote>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("planningpoker");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(PlanningPokerDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
