using System;

namespace AssignmentSystem.Application.DTOs.Exams;

public record CreateExamDto
{
    public string Title { get; init; } = string.Empty;
    public Guid ClassId { get; init; }
    public Guid SubjectId { get; init; }
    public DateTime StartTime { get; init; }
    public DateTime EndTime { get; init; }
    public string RoomNumber { get; init; } = string.Empty;
}
