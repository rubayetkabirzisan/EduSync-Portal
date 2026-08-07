using FluentValidation;

namespace AssignmentSystem.Application.DTOs.Submissions;

public class CreateSubmissionRequest
{
    public Guid AssignmentId { get; set; }
    public string Content { get; set; } = string.Empty;
}

public class CreateSubmissionRequestValidator : AbstractValidator<CreateSubmissionRequest>
{
    public CreateSubmissionRequestValidator()
    {
        RuleFor(x => x.AssignmentId).NotEmpty();
        RuleFor(x => x.Content).NotEmpty().MaximumLength(10000);
    }
}

public class UpdateSubmissionRequest
{
    public string Content { get; set; } = string.Empty;
}

public class UpdateSubmissionRequestValidator : AbstractValidator<UpdateSubmissionRequest>
{
    public UpdateSubmissionRequestValidator()
    {
        RuleFor(x => x.Content).NotEmpty().MaximumLength(10000);
    }
}

public class GradeSubmissionRequest
{
    public int Marks { get; set; }
    public string? Feedback { get; set; }
}

public class GradeSubmissionRequestValidator : AbstractValidator<GradeSubmissionRequest>
{
    public GradeSubmissionRequestValidator()
    {
        RuleFor(x => x.Marks).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Feedback).MaximumLength(5000).When(x => x.Feedback is not null);
    }
}

public class ChangeSubmissionStatusRequest
{
    public string Status { get; set; } = string.Empty;
}

public class ChangeSubmissionStatusRequestValidator : AbstractValidator<ChangeSubmissionStatusRequest>
{
    private static readonly string[] ValidStatuses =
        { "Submitted", "Late", "UnderReview", "Graded", "NeedsRevision" };

    public ChangeSubmissionStatusRequestValidator()
    {
        RuleFor(x => x.Status).NotEmpty()
            .Must(s => ValidStatuses.Contains(s))
            .WithMessage("Status must be one of: Submitted, Late, UnderReview, Graded, NeedsRevision.");
    }
}

public class SubmissionResponse
{
    public Guid Id { get; set; }
    public Guid AssignmentId { get; set; }
    public string AssignmentTitle { get; set; } = string.Empty;
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int? Marks { get; set; }
    public int MaxMarks { get; set; }
    public string? Feedback { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? GradedAt { get; set; }
}

public class SubmissionListFilter : DTOs.Common.PagedRequest
{
    public string? Status { get; set; }
    public Guid? AssignmentId { get; set; }
    public Guid? StudentId { get; set; }
}
