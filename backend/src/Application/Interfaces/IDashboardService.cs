using AssignmentSystem.Application.DTOs.Dashboard;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace AssignmentSystem.Application.Interfaces;

public interface IDashboardService
{
    Task<AdminDashboardStatsDto> GetAdminStatsAsync(CancellationToken cancellationToken = default);
    Task<TeacherDashboardStatsDto> GetTeacherStatsAsync(Guid teacherId, CancellationToken cancellationToken = default);
    Task<StudentDashboardStatsDto> GetStudentStatsAsync(Guid studentId, CancellationToken cancellationToken = default);
}
