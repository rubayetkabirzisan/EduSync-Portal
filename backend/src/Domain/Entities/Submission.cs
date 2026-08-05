using AssignmentSystem.Domain.Enums;

namespace AssignmentSystem.Domain.Entities;

public class Submission
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid AssignmentId { get; set; }
    public Assignment Assignment { get; set; } = null!;

    public Guid StudentId { get; set; }
    public User Student { get; set; } = null!;

    public string Content { get; set; } = string.Empty;   // text answer; extend for file uploads later
    public SubmissionStatus Status { get; set; } = SubmissionStatus.Submitted;

    public int? Marks { get; set; }
    public string? Feedback { get; set; }

    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? GradedAt { get; set; }
    public Guid? GradedByTeacherId { get; set; }
}
