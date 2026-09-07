using FluentValidation;

namespace AssignmentSystem.Application.DTOs.Subjects;

public class CreateSubjectRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Syllabus { get; set; } = string.Empty;
}

public class CreateSubjectRequestValidator : AbstractValidator<CreateSubjectRequest>
{
    public CreateSubjectRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Code).NotEmpty().MaximumLength(30);
        RuleFor(x => x.Syllabus).MaximumLength(10000);
    }
}

public class UpdateSubjectRequest
{
    public string? Name { get; set; }
    public string? Code { get; set; }
    public string? Syllabus { get; set; }
}

public class UpdateSubjectRequestValidator : AbstractValidator<UpdateSubjectRequest>
{
    public UpdateSubjectRequestValidator()
    {
        RuleFor(x => x.Name).MaximumLength(150).When(x => x.Name is not null);
        RuleFor(x => x.Code).MaximumLength(30).When(x => x.Code is not null);
        RuleFor(x => x.Syllabus).MaximumLength(10000).When(x => x.Syllabus is not null);
    }
}

public class SubjectResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Syllabus { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
