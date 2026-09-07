using AssignmentSystem.Domain.Enums;
using System;
using System.Text.Json.Serialization;

namespace AssignmentSystem.Application.DTOs.Leaves;

public record LeaveApplicationDto
{
    public Guid Id { get; init; }
    public Guid StudentId { get; init; }
    public string StudentName { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty;
    public DateTime StartDate { get; init; }
    public DateTime EndDate { get; init; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public LeaveStatus Status { get; init; }
    public string? AdminFeedback { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}
