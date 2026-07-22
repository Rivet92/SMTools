using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SMTools.Identity.Models;
using SMTools.Abstractions.ValueObjects;

namespace SMTools.Identity.Data.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasIndex(u => new { u.Provider, u.ProviderUserId }).IsUnique();
        builder.Property(u => u.Name).HasMaxLength(256);
        builder.Property(u => u.Email).HasMaxLength(256);
        builder.Property(u => u.Provider).HasMaxLength(64);
        builder.Property(u => u.ProviderUserId).HasMaxLength(256);

        builder.Property(u => u.UserAvatarUrl)
            .HasConversion(
                avatar => avatar!.ToString(),
                value => AvatarUrl.Create(value)!)
            .HasColumnName("AvatarUrl");

        builder.Property(u => u.OAuthAvatarUrl)
            .HasMaxLength(2048);
    }
}

public sealed class UserSessionConfiguration : IEntityTypeConfiguration<UserSession>
{
    public void Configure(EntityTypeBuilder<UserSession> builder)
    {
        builder.HasIndex(s => new { s.UserId, s.ExpiresAt });
        builder.HasOne(s => s.User)
            .WithMany(u => u.Sessions)
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
