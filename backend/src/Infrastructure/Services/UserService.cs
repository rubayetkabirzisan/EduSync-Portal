using AssignmentSystem.Application.DTOs.Common;
using AssignmentSystem.Application.DTOs.Users;
using AssignmentSystem.Application.Interfaces;
using AssignmentSystem.Domain.Entities;
using AssignmentSystem.Domain.Enums;
using AssignmentSystem.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystem.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _db;
    private readonly PasswordHasher<User> _hasher = new();

    public UserService(AppDbContext db) => _db = db;

    public async Task<UserResponse> CreateAsync(CreateUserRequest request)
    {
        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
            throw new InvalidOperationException("A user with this email already exists.");

        if (request.Role == "Student" && request.ClassId.HasValue)
        {
            if (!await _db.Classes.AnyAsync(c => c.Id == request.ClassId.Value))
                throw new InvalidOperationException("The specified class does not exist.");
        }

        var user = new User
        {
            Name = request.Name,
            Email = request.Email,
            Role = Enum.Parse<UserRole>(request.Role),
            ClassId = request.Role == "Student" ? request.ClassId : null
        };
        user.PasswordHash = _hasher.HashPassword(user, request.Password);

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return await MapToResponse(user.Id);
    }

    public async Task<UserResponse?> GetByIdAsync(Guid id)
    {
        var user = await _db.Users.Include(u => u.Class).FirstOrDefaultAsync(u => u.Id == id);
        return user is null ? null : ToResponse(user);
    }

    public async Task<PagedResponse<UserResponse>> GetAllAsync(int page, int pageSize, string? role = null, string? search = null)
    {
        var query = _db.Users.Include(u => u.Class).AsQueryable();

        if (!string.IsNullOrEmpty(role) && Enum.TryParse<UserRole>(role, out var parsed))
            query = query.Where(u => u.Role == parsed);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(u => u.Name.Contains(search) || u.Email.Contains(search));

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResponse<UserResponse>
        {
            Items = items.Select(ToResponse).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<UserResponse?> UpdateAsync(Guid id, UpdateUserRequest request)
    {
        var user = await _db.Users.FindAsync(id);
        if (user is null) return null;

        if (request.Name is not null) user.Name = request.Name;
        if (request.Email is not null)
        {
            if (await _db.Users.AnyAsync(u => u.Email == request.Email && u.Id != id))
                throw new InvalidOperationException("A user with this email already exists.");
            user.Email = request.Email;
        }
        if (request.ClassId.HasValue) user.ClassId = request.ClassId;

        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await MapToResponse(user.Id);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user is null) return false;

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return true;
    }

    private async Task<UserResponse> MapToResponse(Guid id)
    {
        var user = await _db.Users.Include(u => u.Class).FirstAsync(u => u.Id == id);
        return ToResponse(user);
    }

    private static UserResponse ToResponse(User user) => new()
    {
        Id = user.Id,
        Name = user.Name,
        Email = user.Email,
        Role = user.Role.ToString(),
        ClassId = user.ClassId,
        ClassName = user.Class?.Name,
        CreatedAt = user.CreatedAt
    };
}
