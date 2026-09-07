using AssignmentSystem.Domain.Enums;
using System;
using System.Text.Json.Serialization;

namespace AssignmentSystem.Application.DTOs.Scholarships;

public record ScholarshipApplicationDto
{
    public Guid Id { get; init; }
    public Guid ScholarshipId { get; init; }
    public string ScholarshipName { get; init; } = string.Empty;
    public Guid StudentId { get; init; }
    public string StudentName { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty;
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ScholarshipStatus Status { get; init; }
    public string? AdminFeedback { get; init; }
    public DateTime CreatedAt { get; init; }
}
