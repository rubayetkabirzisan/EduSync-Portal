using AssignmentSystem.Application.DTOs.Classes;
using AssignmentSystem.Application.DTOs.Common;
using AssignmentSystem.Application.Interfaces;
using AssignmentSystem.Domain.Entities;
using AssignmentSystem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystem.Infrastructure.Services;

public class ClassService : IClassService
{
    private readonly AppDbContext _db;

    public ClassService(AppDbContext db) => _db = db;

    public async Task<ClassResponse> CreateAsync(CreateClassRequest request)
    {
        var entity = new Class
        {
            Name = request.Name,
            Section = request.Section
        };

        _db.Classes.Add(entity);
        await _db.SaveChangesAsync();
        return ToResponse(entity, 0);
    }

    public async Task<ClassResponse?> GetByIdAsync(Guid id)
    {
        var entity = await _db.Classes
            .Include(c => c.Students)
            .FirstOrDefaultAsync(c => c.Id == id);
        return entity is null ? null : ToResponse(entity, entity.Students.Count);
    }

    public async Task<PagedResponse<ClassResponse>> GetAllAsync(int page, int pageSize, string? search = null)
    {
        var query = _db.Classes.AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(c => c.Name.Contains(search));

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new ClassResponse
            {
                Id = c.Id,
                Name = c.Name,
                Section = c.Section,
                StudentCount = c.Students.Count,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();

        return new PagedResponse<ClassResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<ClassResponse?> UpdateAsync(Guid id, UpdateClassRequest request)
    {
        var entity = await _db.Classes.Include(c => c.Students).FirstOrDefaultAsync(c => c.Id == id);
        if (entity is null) return null;

        if (request.Name is not null) entity.Name = request.Name;
        if (request.Section is not null) entity.Section = request.Section;

        await _db.SaveChangesAsync();
        return ToResponse(entity, entity.Students.Count);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var entity = await _db.Classes.FindAsync(id);
        if (entity is null) return false;

        _db.Classes.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    private static ClassResponse ToResponse(Class c, int studentCount) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Section = c.Section,
        StudentCount = studentCount,
        CreatedAt = c.CreatedAt
    };
}
