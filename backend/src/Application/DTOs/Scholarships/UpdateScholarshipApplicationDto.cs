using AssignmentSystem.Domain.Enums;

namespace AssignmentSystem.Application.DTOs.Scholarships;

public record UpdateScholarshipApplicationDto
{
    public ScholarshipStatus Status { get; init; }
    public string? AdminFeedback { get; init; }
}
