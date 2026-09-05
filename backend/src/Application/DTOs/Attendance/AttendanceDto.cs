using System;

namespace AssignmentSystem.Application.DTOs.Attendance;

public record AttendanceDto
{
    public Guid Id { get; init; }
    public Guid StudentId { get; init; }
    public string StudentName { get; init; } = string.Empty;
    public Guid SubjectId { get; init; }
    public string SubjectName { get; init; } = string.Empty;
    public DateTime Date { get; init; }
    public bool IsPresent { get; init; }
    public string Remarks { get; init; } = string.Empty;
}
