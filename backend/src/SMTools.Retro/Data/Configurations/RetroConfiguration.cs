using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SMTools.Abstractions.ValueObjects;
using SMTools.Retro.Models;

namespace SMTools.Retro.Data.Configurations;

public sealed class RetroTemplateConfiguration : IEntityTypeConfiguration<RetroTemplate>
{
    public void Configure(EntityTypeBuilder<RetroTemplate> builder)
    {
        builder.HasIndex(t => t.Key).IsUnique();
    }
}

public sealed class RetroColumnConfiguration : IEntityTypeConfiguration<RetroColumn>
{
    public void Configure(EntityTypeBuilder<RetroColumn> builder)
    {
        builder.Property(c => c.Key).HasMaxLength(64);
        builder.Property(c => c.Color).HasMaxLength(32);
        builder.Property(c => c.Icon).HasMaxLength(64);

        builder.HasOne(c => c.Template)
            .WithMany(t => t.Columns)
            .HasForeignKey(c => c.TemplateId)
            .OnDelete(DeleteBehavior.Cascade);

    }
}

public sealed class RetroRoomConfiguration : IEntityTypeConfiguration<RetroRoom>
{
    public void Configure(EntityTypeBuilder<RetroRoom> builder)
    {
        builder.HasOne(r => r.Template)
            .WithMany(t => t.Rooms)
            .HasForeignKey(r => r.TemplateId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(r => r.Participants)
            .WithOne(p => p.Room)
            .HasForeignKey(p => p.RoomId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.Cards)
            .WithOne(c => c.Room)
            .HasForeignKey(c => c.RoomId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.Groups)
            .WithOne(g => g.Room)
            .HasForeignKey(g => g.RoomId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.Votes)
            .WithOne(v => v.Room)
            .HasForeignKey(v => v.RoomId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.ActionItems)
            .WithOne(a => a.Room)
            .HasForeignKey(a => a.RoomId)
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

public sealed class RetroRoomParticipantConfiguration : IEntityTypeConfiguration<RetroRoomParticipant>
{
    public void Configure(EntityTypeBuilder<RetroRoomParticipant> builder)
    {
        builder.Property(p => p.DisplayName).HasMaxLength(256);
        builder.Property(p => p.ConnectionId).HasMaxLength(256);

        builder.HasIndex(p => new { p.RoomId, p.UserId });
        builder.HasIndex(p => p.ConnectionId).HasFilter("\"ConnectionId\" IS NOT NULL AND \"ConnectionId\" <> ''");
        builder.HasIndex(p => p.RoomId).HasFilter("\"IsOwner\" = true").IsUnique();

        builder.HasMany(p => p.Votes)
            .WithOne(v => v.Participant)
            .HasForeignKey(v => v.ParticipantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.AuthoredCards)
            .WithOne(c => c.Author)
            .HasForeignKey(c => c.AuthorParticipantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.AssignedActionItems)
            .WithOne(a => a.Assignee)
            .HasForeignKey(a => a.AssigneeParticipantId)
            .OnDelete(DeleteBehavior.SetNull);

    }
}

public sealed class RetroCardConfiguration : IEntityTypeConfiguration<RetroCard>
{
    public void Configure(EntityTypeBuilder<RetroCard> builder)
    {
        builder.Property(c => c.Content).HasColumnType("text");

        builder.HasOne(c => c.Column)
            .WithMany(col => col.Cards)
            .HasForeignKey(c => c.ColumnId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Group)
            .WithMany(g => g.Cards)
            .HasForeignKey(c => c.GroupId)
            .OnDelete(DeleteBehavior.SetNull);

    }
}

public sealed class RetroCardGroupConfiguration : IEntityTypeConfiguration<RetroCardGroup>
{
    public void Configure(EntityTypeBuilder<RetroCardGroup> builder)
    {
        builder.Property(g => g.Title).HasMaxLength(256);
    }
}

public sealed class RetroVoteConfiguration : IEntityTypeConfiguration<RetroVote>
{
    public void Configure(EntityTypeBuilder<RetroVote> builder)
    {
        builder.HasIndex(v => new { v.CardId, v.ParticipantId }).IsUnique();
    }
}

public sealed class RetroActionItemConfiguration : IEntityTypeConfiguration<RetroActionItem>
{
    public void Configure(EntityTypeBuilder<RetroActionItem> builder)
    {
        builder.Property(a => a.Content).HasColumnType("text");
    }
}
