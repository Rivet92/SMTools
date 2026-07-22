using Microsoft.EntityFrameworkCore;
using SMTools.Kanban.Models;
using SMTools.Abstractions.ValueObjects;

namespace SMTools.Kanban.Data;

public class KanbanDbContext : DbContext
{
    public KanbanDbContext(DbContextOptions<KanbanDbContext> options) : base(options) { }

    public DbSet<KanbanRoom> KanbanRooms => Set<KanbanRoom>();
    public DbSet<KanbanRoomParticipant> KanbanRoomParticipants => Set<KanbanRoomParticipant>();
    public DbSet<KanbanColumn> KanbanColumns => Set<KanbanColumn>();
    public DbSet<KanbanCard> KanbanCards => Set<KanbanCard>();
    public DbSet<KanbanCardComment> KanbanCardComments => Set<KanbanCardComment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("kanban");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(KanbanDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
