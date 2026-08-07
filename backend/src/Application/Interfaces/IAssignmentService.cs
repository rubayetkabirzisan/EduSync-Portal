using AssignmentSystem.Application.DTOs.Assignments;
using AssignmentSystem.Application.DTOs.Common;

namespace AssignmentSystem.Application.Interfaces;

public interface IAssignmentService
{
    // Teacher operations
    Task<AssignmentResponse> CreateAsync(Guid teacherId, CreateAssignmentRequest request);
    Task<AssignmentResponse?> GetByIdAsync(Guid id);
    Task<AssignmentResponse?> UpdateAsync(Guid id, Guid teacherId, UpdateAssignmentRequest request);
    Task<bool> DeleteAsync(Guid id, Guid teacherId);
    Task<AssignmentResponse?> PublishAsync(Guid id, Guid teacherId);

    // Shared list
    Task<PagedResponse<AssignmentResponse>> GetAllAsync(AssignmentListFilter filter, Guid? teacherId = null);

    // Student: published assignments for their class
    Task<PagedResponse<AssignmentResponse>> GetStudentAssignmentsAsync(Guid studentId, AssignmentListFilter filter);
}
