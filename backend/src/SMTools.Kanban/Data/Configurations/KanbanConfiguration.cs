using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SMTools.Abstractions.ValueObjects;
using SMTools.Kanban.Models;

namespace SMTools.Kanban.Data.Configurations;

public sealed class KanbanRoomConfiguration : IEntityTypeConfiguration<KanbanRoom>
{
    public void Configure(EntityTypeBuilder<KanbanRoom> builder)
    {
        builder.HasMany(r => r.Participants)
            .WithOne(p => p.Room)
            .HasForeignKey(p => p.RoomId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.Columns)
            .WithOne(c => c.Room)
            .HasForeignKey(c => c.RoomId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.Cards)
            .WithOne(c => c.Room)
            .HasForeignKey(c => c.RoomId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Ignore(r => r.HasPassword);
        builder.Ignore(r => r.PasswordHash);

        builder.Property(r => r.RoomPassword)
            .HasConversion(
                pwd => pwd!.Hash,
                hash => Password.FromHash(hash))
            .HasColumnName("PasswordHash");

        builder.Property(r => r.Title).HasMaxLength(256);
    }
}

public sealed class KanbanRoomParticipantConfiguration : IEntityTypeConfiguration<KanbanRoomParticipant>
{
    public void Configure(EntityTypeBuilder<KanbanRoomParticipant> builder)
    {
        builder.Property(p => p.DisplayName).HasMaxLength(256);
        builder.Property(p => p.ConnectionId).HasMaxLength(256);

        builder.HasIndex(p => new { p.RoomId, p.UserId });
        builder.HasIndex(p => p.ConnectionId).HasFilter("\"ConnectionId\" IS NOT NULL AND \"ConnectionId\" <> ''");
        builder.HasIndex(p => p.RoomId).HasFilter("\"IsOwner\" = true").IsUnique();

        builder.HasMany(p => p.AuthoredCards)
            .WithOne(c => c.AuthorParticipant)
            .HasForeignKey(c => c.AuthorParticipantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(p => p.AssignedCards)
            .WithOne(c => c.Assignee)
            .HasForeignKey(c => c.AssignedParticipantId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public sealed class KanbanColumnConfiguration : IEntityTypeConfiguration<KanbanColumn>
{
    public void Configure(EntityTypeBuilder<KanbanColumn> builder)
    {
        builder.Property(c => c.Title).HasMaxLength(256);
        builder.Property(c => c.Description).HasMaxLength(4096);

        builder.HasIndex(c => new { c.RoomId, c.DisplayOrder });

        builder.HasMany(c => c.Cards)
            .WithOne(c => c.Column)
            .HasForeignKey(c => c.ColumnId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class KanbanCardConfiguration : IEntityTypeConfiguration<KanbanCard>
{
    public void Configure(EntityTypeBuilder<KanbanCard> builder)
    {
        builder.Property(c => c.Title).HasMaxLength(512);
        builder.Property(c => c.Description).HasMaxLength(4096);
        builder.Property(c => c.RepoUrl).HasMaxLength(2048);
        builder.Property(c => c.RepoBranch).HasMaxLength(256);

        builder.HasIndex(c => c.ColumnId);

        builder.HasMany(c => c.Comments)
            .WithOne(c => c.Card)
            .HasForeignKey(c => c.CardId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class KanbanCardCommentConfiguration : IEntityTypeConfiguration<KanbanCardComment>
{
    public void Configure(EntityTypeBuilder<KanbanCardComment> builder)
    {
        builder.Property(c => c.Content).HasMaxLength(4096);

        builder.HasOne(c => c.AuthorParticipant)
            .WithMany()
            .HasForeignKey(c => c.AuthorParticipantId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
