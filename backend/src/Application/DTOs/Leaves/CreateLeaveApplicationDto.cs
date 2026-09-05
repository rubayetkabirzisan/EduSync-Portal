using System;

namespace AssignmentSystem.Application.DTOs.Leaves;

public record CreateLeaveApplicationDto
{
    public string Reason { get; init; } = string.Empty;
    public DateTime StartDate { get; init; }
    public DateTime EndDate { get; init; }
}
