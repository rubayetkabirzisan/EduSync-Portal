using AssignmentSystem.Application.DTOs.Attendance;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace AssignmentSystem.Application.Interfaces;

public interface IAttendanceService
{
    Task<IEnumerable<AttendanceDto>> GetByStudentAsync(Guid studentId, CancellationToken cancellationToken = default);
    Task<IEnumerable<AttendanceDto>> GetBySubjectAsync(Guid subjectId, DateTime date, CancellationToken cancellationToken = default);
    Task MarkAttendanceAsync(CreateAttendanceDto dto, CancellationToken cancellationToken = default);
}
