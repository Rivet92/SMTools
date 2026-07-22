using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SMTools.Notes.Models;

namespace SMTools.Notes.Data.Configurations;

public sealed class NoteConfiguration : IEntityTypeConfiguration<Note>
{
    public void Configure(EntityTypeBuilder<Note> builder)
    {
        builder.Property(n => n.Title).HasMaxLength(256);
        builder.Property(n => n.Content).HasColumnType("text");
        builder.Property(n => n.Position).HasDefaultValue(0);
        builder.HasIndex(n => n.UserId);
        builder.HasIndex(n => n.IsArchived);
        builder.HasIndex(n => n.Position);
    }
}
