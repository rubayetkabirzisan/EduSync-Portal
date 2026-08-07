using AssignmentSystem.Application.DTOs.Common;
using AssignmentSystem.Application.DTOs.Users;

namespace AssignmentSystem.Application.Interfaces;

public interface IUserService
{
    Task<UserResponse> CreateAsync(CreateUserRequest request);
    Task<UserResponse?> GetByIdAsync(Guid id);
    Task<PagedResponse<UserResponse>> GetAllAsync(int page, int pageSize, string? role = null, string? search = null);
    Task<UserResponse?> UpdateAsync(Guid id, UpdateUserRequest request);
    Task<bool> DeleteAsync(Guid id);
}
