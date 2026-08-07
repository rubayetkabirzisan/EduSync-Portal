using AssignmentSystem.Application.DTOs.Common;
using AssignmentSystem.Application.DTOs.Subjects;
using AssignmentSystem.Application.Interfaces;
using AssignmentSystem.Domain.Entities;
using AssignmentSystem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystem.Infrastructure.Services;

public class SubjectService : ISubjectService
{
    private readonly AppDbContext _db;

    public SubjectService(AppDbContext db) => _db = db;

    public async Task<SubjectResponse> CreateAsync(CreateSubjectRequest request)
    {
        if (await _db.Subjects.AnyAsync(s => s.Code == request.Code))
            throw new InvalidOperationException($"A subject with code '{request.Code}' already exists.");

        var entity = new Subject
        {
            Name = request.Name,
            Code = request.Code
        };

        _db.Subjects.Add(entity);
        await _db.SaveChangesAsync();
        return ToResponse(entity);
    }

    public async Task<SubjectResponse?> GetByIdAsync(Guid id)
    {
        var entity = await _db.Subjects.FindAsync(id);
        return entity is null ? null : ToResponse(entity);
    }

    public async Task<PagedResponse<SubjectResponse>> GetAllAsync(int page, int pageSize, string? search = null)
    {
        var query = _db.Subjects.AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(s => s.Name.Contains(search) || s.Code.Contains(search));

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResponse<SubjectResponse>
        {
            Items = items.Select(ToResponse).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<SubjectResponse?> UpdateAsync(Guid id, UpdateSubjectRequest request)
    {
        var entity = await _db.Subjects.FindAsync(id);
        if (entity is null) return null;

        if (request.Name is not null) entity.Name = request.Name;
        if (request.Code is not null)
        {
            if (await _db.Subjects.AnyAsync(s => s.Code == request.Code && s.Id != id))
                throw new InvalidOperationException($"A subject with code '{request.Code}' already exists.");
            entity.Code = request.Code;
        }

        await _db.SaveChangesAsync();
        return ToResponse(entity);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var entity = await _db.Subjects.FindAsync(id);
        if (entity is null) return false;

        _db.Subjects.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    private static SubjectResponse ToResponse(Subject s) => new()
    {
        Id = s.Id,
        Name = s.Name,
        Code = s.Code,
        CreatedAt = s.CreatedAt
    };
}
