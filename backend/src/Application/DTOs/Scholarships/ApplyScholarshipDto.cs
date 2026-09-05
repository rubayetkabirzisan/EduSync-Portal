using System;

namespace AssignmentSystem.Application.DTOs.Scholarships;

public record ApplyScholarshipDto
{
    public Guid ScholarshipId { get; init; }
    public string Reason { get; init; } = string.Empty;
}
