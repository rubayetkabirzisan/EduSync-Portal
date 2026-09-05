using AssignmentSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AssignmentSystem.Infrastructure.Data.Configurations;

public class ScholarshipApplicationConfiguration : IEntityTypeConfiguration<ScholarshipApplication>
{
    public void Configure(EntityTypeBuilder<ScholarshipApplication> builder)
    {
        builder.HasKey(s => s.Id);
        
        builder.Property(s => s.Reason)
            .IsRequired();

        builder.HasOne(s => s.Scholarship)
            .WithMany(s => s.Applications)
            .HasForeignKey(s => s.ScholarshipId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(s => s.Student)
            .WithMany()
            .HasForeignKey(s => s.StudentId)
            .OnDelete(DeleteBehavior.Cascade);
            
        // Prevent multiple applications for the same scholarship by the same student
        builder.HasIndex(s => new { s.ScholarshipId, s.StudentId }).IsUnique();
    }
}
