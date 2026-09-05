using AssignmentSystem.Domain.Enums;

namespace AssignmentSystem.Application.DTOs.Leaves;

public record UpdateLeaveApplicationDto
{
    public LeaveStatus Status { get; init; }
    public string? AdminFeedback { get; init; }
}
