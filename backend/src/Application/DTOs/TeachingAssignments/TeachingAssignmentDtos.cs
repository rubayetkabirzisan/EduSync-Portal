using FluentValidation;

namespace AssignmentSystem.Application.DTOs.TeachingAssignments;

public class CreateTeachingAssignmentRequest
{
    public Guid TeacherId { get; set; }
    public Guid ClassId { get; set; }
    public Guid SubjectId { get; set; }
}

public class CreateTeachingAssignmentRequestValidator : AbstractValidator<CreateTeachingAssignmentRequest>
{
    public CreateTeachingAssignmentRequestValidator()
    {
        RuleFor(x => x.TeacherId).NotEmpty();
        RuleFor(x => x.ClassId).NotEmpty();
        RuleFor(x => x.SubjectId).NotEmpty();
    }
}

public class TeachingAssignmentResponse
{
    public Guid Id { get; set; }
    public Guid TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public Guid ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public Guid SubjectId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
