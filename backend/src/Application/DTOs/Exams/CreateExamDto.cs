using System;

namespace AssignmentSystem.Application.DTOs.Exams;

public record CreateExamDto
{
    public string Title { get; init; } = string.Empty;
    public Guid ClassId { get; init; }
    public Guid SubjectId { get; init; }
    public DateTime StartTime { get; init; }
    public int DurationMinutes { get; init; }
    public int MaxMarks { get; init; }
    public string RoomName { get; init; } = string.Empty;
}
