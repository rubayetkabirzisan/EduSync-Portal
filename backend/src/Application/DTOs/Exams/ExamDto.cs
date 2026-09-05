using System;

namespace AssignmentSystem.Application.DTOs.Exams;

public record ExamDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public Guid ClassId { get; init; }
    public string ClassName { get; init; } = string.Empty;
    public Guid SubjectId { get; init; }
    public string SubjectName { get; init; } = string.Empty;
    public DateTime StartTime { get; init; }
    public DateTime EndTime { get; init; }
    public string RoomNumber { get; init; } = string.Empty;
}
