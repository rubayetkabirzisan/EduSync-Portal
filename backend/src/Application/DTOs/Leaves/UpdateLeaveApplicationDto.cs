using AssignmentSystem.Domain.Enums;
using System.Text.Json.Serialization;

namespace AssignmentSystem.Application.DTOs.Leaves;

public record UpdateLeaveApplicationDto
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public LeaveStatus Status { get; init; }
    public string? AdminFeedback { get; init; }
}
