using System;

namespace AssignmentSystem.Application.DTOs.Scholarships;

public record ScholarshipDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public DateTime Deadline { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
}
