using AssignmentSystem.Application.DTOs.Common;
using AssignmentSystem.Application.DTOs.Subjects;

namespace AssignmentSystem.Application.Interfaces;

public interface ISubjectService
{
    Task<SubjectResponse> CreateAsync(CreateSubjectRequest request);
    Task<SubjectResponse?> GetByIdAsync(Guid id);
    Task<PagedResponse<SubjectResponse>> GetAllAsync(int page, int pageSize, string? search = null);
    Task<SubjectResponse?> UpdateAsync(Guid id, UpdateSubjectRequest request);
    Task<bool> DeleteAsync(Guid id);
}
