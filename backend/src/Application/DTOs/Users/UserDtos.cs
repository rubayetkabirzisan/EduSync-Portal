using FluentValidation;

namespace AssignmentSystem.Application.DTOs.Users;

public class CreateUserRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;        // "Admin" | "Teacher" | "Student"
    public Guid? ClassId { get; set; }                       // Required when Role == Student
}

public class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
{
    private static readonly string[] ValidRoles = { "Admin", "Teacher", "Student" };

    public CreateUserRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6).MaximumLength(100);
        RuleFor(x => x.Role).NotEmpty().Must(r => ValidRoles.Contains(r))
            .WithMessage("Role must be one of: Admin, Teacher, Student.");
        RuleFor(x => x.ClassId)
            .NotNull().When(x => x.Role == "Student")
            .WithMessage("ClassId is required for students.");
    }
}

public class UpdateUserRequest
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public Guid? ClassId { get; set; }
}

public class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
{
    public UpdateUserRequestValidator()
    {
        RuleFor(x => x.Name).MaximumLength(200).When(x => x.Name is not null);
        RuleFor(x => x.Email).EmailAddress().MaximumLength(256).When(x => x.Email is not null);
    }
}

public class UserResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public Guid? ClassId { get; set; }
    public string? ClassName { get; set; }
    public DateTime CreatedAt { get; set; }
}
