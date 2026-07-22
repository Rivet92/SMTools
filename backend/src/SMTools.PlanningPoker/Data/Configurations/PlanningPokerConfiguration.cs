using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SMTools.Abstractions.ValueObjects;
using SMTools.PlanningPoker.Models;

namespace SMTools.PlanningPoker.Data.Configurations;

public sealed class PlanningPokerDeckConfiguration : IEntityTypeConfiguration<PlanningPokerDeck>
{
    public void Configure(EntityTypeBuilder<PlanningPokerDeck> builder)
    {
        builder.HasIndex(d => d.Key).IsUnique();
    }
}

public sealed class PlanningPokerCardConfiguration : IEntityTypeConfiguration<PlanningPokerCard>
{
    public void Configure(EntityTypeBuilder<PlanningPokerCard> builder)
    {
    }
}

public sealed class PlanningPokerRoomConfiguration : IEntityTypeConfiguration<PlanningPokerRoom>
{
    public void Configure(EntityTypeBuilder<PlanningPokerRoom> builder)
    {
        builder.HasOne(r => r.Deck)
            .WithMany()
            .HasForeignKey(r => r.DeckId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(r => r.Participants)
            .WithOne(p => p.Room)
            .HasForeignKey(p => p.RoomId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.VoteItems)
            .WithOne(vi => vi.Room)
            .HasForeignKey(vi => vi.RoomId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.Votes)
            .WithOne(v => v.Room)
            .HasForeignKey(v => v.RoomId)
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

public sealed class PlanningPokerRoomParticipantConfiguration : IEntityTypeConfiguration<PlanningPokerRoomParticipant>
{
    public void Configure(EntityTypeBuilder<PlanningPokerRoomParticipant> builder)
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
    }
}

public sealed class PlanningPokerVoteItemConfiguration : IEntityTypeConfiguration<PlanningPokerVoteItem>
{
    public void Configure(EntityTypeBuilder<PlanningPokerVoteItem> builder)
    {
        builder.Property(vi => vi.Title).HasMaxLength(512);

        builder.HasMany(vi => vi.Votes)
            .WithOne(v => v.VoteItem)
            .HasForeignKey(v => v.VoteItemId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class PlanningPokerVoteConfiguration : IEntityTypeConfiguration<PlanningPokerVote>
{
    public void Configure(EntityTypeBuilder<PlanningPokerVote> builder)
    {
        builder.Property(v => v.Value).HasMaxLength(64);
        builder.HasIndex(v => new { v.VoteItemId, v.ParticipantId }).IsUnique();
    }
}
