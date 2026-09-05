using System.Collections.Generic;

namespace AssignmentSystem.Application.DTOs.Dashboard;

public record AdminDashboardStatsDto
{
    public int TotalStudents { get; init; }
    public int TotalTeachers { get; init; }
    public int TotalCourses { get; init; }
    public int PendingLeaveApplications { get; init; }
    public int PendingScholarships { get; init; }
}

public record TeacherDashboardStatsDto
{
    public int AssignedClasses { get; init; }
    public int TotalStudentsTaught { get; init; }
    public int PendingAssignmentsToGrade { get; init; }
    public int UpcomingExams { get; init; }
}

public record StudentDashboardStatsDto
{
    public int EnrolledCourses { get; init; }
    public int PendingAssignments { get; init; }
    public int UpcomingExams { get; init; }
    public double AverageAttendancePercentage { get; init; }
    public string ActiveScholarshipStatus { get; init; } = string.Empty;
}
