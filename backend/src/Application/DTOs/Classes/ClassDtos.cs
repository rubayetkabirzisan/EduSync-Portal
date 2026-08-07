using FluentValidation;

namespace AssignmentSystem.Application.DTOs.Classes;

public class CreateClassRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Section { get; set; }
}

public class CreateClassRequestValidator : AbstractValidator<CreateClassRequest>
{
    public CreateClassRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Section).MaximumLength(50).When(x => x.Section is not null);
    }
}

public class UpdateClassRequest
{
    public string? Name { get; set; }
    public string? Section { get; set; }
}

public class UpdateClassRequestValidator : AbstractValidator<UpdateClassRequest>
{
    public UpdateClassRequestValidator()
    {
        RuleFor(x => x.Name).MaximumLength(150).When(x => x.Name is not null);
        RuleFor(x => x.Section).MaximumLength(50).When(x => x.Section is not null);
    }
}

public class ClassResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Section { get; set; }
    public int StudentCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
