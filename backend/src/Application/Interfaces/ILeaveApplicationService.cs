using AssignmentSystem.Application.DTOs.Leaves;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace AssignmentSystem.Application.Interfaces;

public interface ILeaveApplicationService
{
    Task<LeaveApplicationDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<LeaveApplicationDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<LeaveApplicationDto>> GetForStudentAsync(Guid studentId, CancellationToken cancellationToken = default);
    Task<LeaveApplicationDto> CreateAsync(CreateLeaveApplicationDto dto, Guid studentId, CancellationToken cancellationToken = default);
    Task UpdateOwnAsync(Guid id, Guid studentId, CreateLeaveApplicationDto dto, CancellationToken cancellationToken = default);
    Task UpdateStatusAsync(Guid id, UpdateLeaveApplicationDto dto, CancellationToken cancellationToken = default);
}
