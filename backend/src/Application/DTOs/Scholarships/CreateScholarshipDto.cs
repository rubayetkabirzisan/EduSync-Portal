using System;

namespace AssignmentSystem.Application.DTOs.Scholarships;

public record CreateScholarshipDto
{
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public DateTime Deadline { get; init; }
}
