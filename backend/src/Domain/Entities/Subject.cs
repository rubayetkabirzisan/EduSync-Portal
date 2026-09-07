namespace AssignmentSystem.Domain.Entities;

public class Subject
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;    // e.g. "Mathematics"
    public string Code { get; set; } = string.Empty;    // e.g. "MATH101"
    public string Syllabus { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TeachingAssignment> TeachingAssignments { get; set; } = new List<TeachingAssignment>();
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
}
