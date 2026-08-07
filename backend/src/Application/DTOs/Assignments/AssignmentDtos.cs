using FluentValidation;

namespace AssignmentSystem.Application.DTOs.Assignments;

public class CreateAssignmentRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime Deadline { get; set; }
    public int MaxMarks { get; set; }
    public Guid ClassId { get; set; }
    public Guid SubjectId { get; set; }
    public bool AllowResubmission { get; set; } = true;
    public bool PublishImmediately { get; set; } = false;
}

public class CreateAssignmentRequestValidator : AbstractValidator<CreateAssignmentRequest>
{
    public CreateAssignmentRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(250);
        RuleFor(x => x.Description).NotEmpty();
        RuleFor(x => x.Deadline).GreaterThan(DateTime.UtcNow)
            .WithMessage("Deadline must be in the future.");
        RuleFor(x => x.MaxMarks).GreaterThan(0).LessThanOrEqualTo(1000);
        RuleFor(x => x.ClassId).NotEmpty();
        RuleFor(x => x.SubjectId).NotEmpty();
    }
}

public class UpdateAssignmentRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public DateTime? Deadline { get; set; }
    public int? MaxMarks { get; set; }
    public bool? AllowResubmission { get; set; }
}

public class UpdateAssignmentRequestValidator : AbstractValidator<UpdateAssignmentRequest>
{
    public UpdateAssignmentRequestValidator()
    {
        RuleFor(x => x.Title).MaximumLength(250).When(x => x.Title is not null);
        RuleFor(x => x.MaxMarks).GreaterThan(0).LessThanOrEqualTo(1000)
            .When(x => x.MaxMarks.HasValue);
    }
}

public class AssignmentResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime Deadline { get; set; }
    public int MaxMarks { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool AllowResubmission { get; set; }
    public Guid ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public Guid SubjectId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public Guid TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public int SubmissionCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class AssignmentListFilter : DTOs.Common.PagedRequest
{
    public string? Status { get; set; }        // Draft | Published
    public Guid? ClassId { get; set; }
    public Guid? SubjectId { get; set; }
    public string? Search { get; set; }        // Search in title
}
