using AssignmentSystem.Application.DTOs.Common;
using AssignmentSystem.Application.DTOs.Submissions;

namespace AssignmentSystem.Application.Interfaces;

public interface ISubmissionService
{
    // Student operations
    Task<SubmissionResponse> CreateAsync(Guid studentId, CreateSubmissionRequest request);
    Task<SubmissionResponse?> UpdateAsync(Guid id, Guid studentId, UpdateSubmissionRequest request);
    Task<PagedResponse<SubmissionResponse>> GetStudentSubmissionsAsync(Guid studentId, SubmissionListFilter filter);

    // Teacher operations
    Task<PagedResponse<SubmissionResponse>> GetTeacherSubmissionsAsync(Guid teacherId, SubmissionListFilter filter);
    Task<PagedResponse<SubmissionResponse>> GetAssignmentSubmissionsAsync(Guid assignmentId, Guid teacherId, SubmissionListFilter filter);
    Task<SubmissionResponse?> GradeAsync(Guid id, Guid teacherId, GradeSubmissionRequest request);
    Task<SubmissionResponse?> ChangeStatusAsync(Guid id, Guid teacherId, ChangeSubmissionStatusRequest request);

    // Shared
    Task<SubmissionResponse?> GetByIdAsync(Guid id);
    Task<PagedResponse<SubmissionResponse>> GetAllAsync(SubmissionListFilter filter);
}
