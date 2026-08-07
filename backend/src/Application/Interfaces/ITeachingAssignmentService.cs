using AssignmentSystem.Application.DTOs.Common;
using AssignmentSystem.Application.DTOs.TeachingAssignments;

namespace AssignmentSystem.Application.Interfaces;

public interface ITeachingAssignmentService
{
    Task<TeachingAssignmentResponse> CreateAsync(CreateTeachingAssignmentRequest request);
    Task<PagedResponse<TeachingAssignmentResponse>> GetAllAsync(int page, int pageSize, Guid? teacherId = null, Guid? classId = null);
    Task<bool> DeleteAsync(Guid id);
}
