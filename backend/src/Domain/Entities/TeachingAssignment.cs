namespace AssignmentSystem.Domain.Entities;

// Links a Teacher to a Class + Subject pair they're authorized to teach.
// This is the source of truth for "can this teacher create/grade an
// Assignment for this class+subject" — enforced in AssignmentService, and
// exactly what the authorization unit tests target.
public class TeachingAssignment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid TeacherId { get; set; }
    public User Teacher { get; set; } = null!;

    public Guid ClassId { get; set; }
    public Class Class { get; set; } = null!;

    public Guid SubjectId { get; set; }
    public Subject Subject { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
