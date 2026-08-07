using AssignmentSystem.Application.DTOs.Classes;
using AssignmentSystem.Application.DTOs.Common;

namespace AssignmentSystem.Application.Interfaces;

public interface IClassService
{
    Task<ClassResponse> CreateAsync(CreateClassRequest request);
    Task<ClassResponse?> GetByIdAsync(Guid id);
    Task<PagedResponse<ClassResponse>> GetAllAsync(int page, int pageSize, string? search = null);
    Task<ClassResponse?> UpdateAsync(Guid id, UpdateClassRequest request);
    Task<bool> DeleteAsync(Guid id);
}
