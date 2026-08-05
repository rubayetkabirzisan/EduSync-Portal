using AssignmentSystem.Domain.Enums;

namespace AssignmentSystem.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }

    // Only meaningful when Role == Student: the class/section this student belongs to.
    // Assumption (see README): a student belongs to exactly one class, not multiple
    // course enrollments — keeps scope reasonable for the timeline.
    public Guid? ClassId { get; set; }
    public Class? Class { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TeachingAssignment> TeachingAssignments { get; set; } = new List<TeachingAssignment>();
    public ICollection<Assignment> CreatedAssignments { get; set; } = new List<Assignment>();
    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}
