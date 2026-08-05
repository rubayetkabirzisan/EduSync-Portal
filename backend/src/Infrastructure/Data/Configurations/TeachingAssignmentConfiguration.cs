using AssignmentSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AssignmentSystem.Infrastructure.Data.Configurations;

public class TeachingAssignmentConfiguration : IEntityTypeConfiguration<TeachingAssignment>
{
    public void Configure(EntityTypeBuilder<TeachingAssignment> builder)
    {
        builder.ToTable("TeachingAssignments");
        builder.HasKey(t => t.Id);

        builder.HasOne(t => t.Teacher)
            .WithMany(u => u.TeachingAssignments)
            .HasForeignKey(t => t.TeacherId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(t => t.Class)
            .WithMany(c => c.TeachingAssignments)
            .HasForeignKey(t => t.ClassId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(t => t.Subject)
            .WithMany(s => s.TeachingAssignments)
            .HasForeignKey(t => t.SubjectId)
            .OnDelete(DeleteBehavior.Cascade);

        // A teacher is only assigned once to a given class+subject pair.
        builder.HasIndex(t => new { t.TeacherId, t.ClassId, t.SubjectId }).IsUnique();
    }
}
