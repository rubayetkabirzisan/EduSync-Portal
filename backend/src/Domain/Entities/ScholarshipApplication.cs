using AssignmentSystem.Domain.Enums;
using System;

namespace AssignmentSystem.Domain.Entities;

public class ScholarshipApplication
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ScholarshipId { get; set; }
    public Scholarship Scholarship { get; set; } = null!;
    public Guid StudentId { get; set; }
    public User Student { get; set; } = null!;
    public string Reason { get; set; } = string.Empty;
    public ScholarshipStatus Status { get; set; } = ScholarshipStatus.Pending;
    public string? AdminFeedback { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
