using AssignmentSystem.Domain.Enums;
using System.Text.Json.Serialization;

namespace AssignmentSystem.Application.DTOs.Scholarships;

public record UpdateScholarshipApplicationDto
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ScholarshipStatus Status { get; init; }
    public string? AdminFeedback { get; init; }
}
