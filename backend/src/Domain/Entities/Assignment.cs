using AssignmentSystem.Domain.Enums;

namespace AssignmentSystem.Domain.Entities;

public class Assignment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime Deadline { get; set; }
    public int MaxMarks { get; set; }
    public AssignmentStatus Status { get; set; } = AssignmentStatus.Draft;

    // Resolves the brief's "update a submission before the deadline, if
    // allowed" line into something concrete: a teacher can lock submissions
    // as final even before the deadline by setting this false.
    public bool AllowResubmission { get; set; } = true;

    public Guid ClassId { get; set; }
    public Class Class { get; set; } = null!;

    public Guid SubjectId { get; set; }
    public Subject Subject { get; set; } = null!;

    public Guid TeacherId { get; set; }
    public User Teacher { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}
