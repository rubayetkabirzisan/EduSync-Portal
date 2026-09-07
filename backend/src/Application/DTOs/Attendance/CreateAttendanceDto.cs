using System;
using System.Collections.Generic;

namespace AssignmentSystem.Application.DTOs.Attendance;

public record CreateAttendanceDto
{
    public Guid ClassId { get; init; }
    public Guid SubjectId { get; init; }
    public DateTime Date { get; init; }
    
    // Allows marking multiple students at once
    public List<StudentAttendanceRecordDto> Records { get; init; } = new();
}

public record StudentAttendanceRecordDto
{
    public Guid StudentId { get; init; }
    public string Status { get; init; } = "Present";
    public string Remarks { get; init; } = string.Empty;
}
