namespace AssignmentSystem.Domain.Entities;

public class Class
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;   // e.g. "Grade 10" or "BSc CSE - Batch 2024"
    public string? Section { get; set; }                // e.g. "A" - optional

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<User> Students { get; set; } = new List<User>();
    public ICollection<TeachingAssignment> TeachingAssignments { get; set; } = new List<TeachingAssignment>();
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
}
