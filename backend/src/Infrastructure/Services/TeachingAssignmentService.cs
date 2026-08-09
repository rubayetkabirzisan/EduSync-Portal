using AssignmentSystem.Application.DTOs.Common;
using AssignmentSystem.Application.DTOs.TeachingAssignments;
using AssignmentSystem.Application.Interfaces;
using AssignmentSystem.Domain.Entities;
using AssignmentSystem.Domain.Enums;
using AssignmentSystem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystem.Infrastructure.Services;

public class TeachingAssignmentService : ITeachingAssignmentService
{
    private readonly AppDbContext _db;

    public TeachingAssignmentService(AppDbContext db) => _db = db;

    public async Task<TeachingAssignmentResponse> CreateAsync(CreateTeachingAssignmentRequest request)
    {
        var teacher = await _db.Users.FindAsync(request.TeacherId);
        if (teacher is null || teacher.Role != UserRole.Teacher)
            throw new InvalidOperationException("The specified user is not a teacher.");

        if (!await _db.Classes.AnyAsync(c => c.Id == request.ClassId))
            throw new InvalidOperationException("The specified class does not exist.");

        if (!await _db.Subjects.AnyAsync(s => s.Id == request.SubjectId))
            throw new InvalidOperationException("The specified subject does not exist.");

        if (await _db.TeachingAssignments.AnyAsync(ta =>
            ta.TeacherId == request.TeacherId &&
            ta.ClassId == request.ClassId &&
            ta.SubjectId == request.SubjectId))
            throw new InvalidOperationException("This teacher is already assigned to this class and subject.");

        var entity = new TeachingAssignment
        {
            TeacherId = request.TeacherId,
            ClassId = request.ClassId,
            SubjectId = request.SubjectId
        };

        _db.TeachingAssignments.Add(entity);
        await _db.SaveChangesAsync();

        return await MapToResponse(entity.Id);
    }

    public async Task<PagedResponse<TeachingAssignmentResponse>> GetAllAsync(int page, int pageSize, Guid? teacherId = null, Guid? classId = null)
    {
        var query = _db.TeachingAssignments
            .Include(ta => ta.Teacher)
            .Include(ta => ta.Class)
            .Include(ta => ta.Subject)
            .AsQueryable();

        if (teacherId.HasValue)
            query = query.Where(ta => ta.TeacherId == teacherId.Value);
        if (classId.HasValue)
            query = query.Where(ta => ta.ClassId == classId.Value);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(ta => ta.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResponse<TeachingAssignmentResponse>
        {
            Items = items.Select(ToResponse).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var entity = await _db.TeachingAssignments.FindAsync(id);
        if (entity is null) return false;

        _db.TeachingAssignments.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    private async Task<TeachingAssignmentResponse> MapToResponse(Guid id)
    {
        var entity = await _db.TeachingAssignments
            .Include(ta => ta.Teacher)
            .Include(ta => ta.Class)
            .Include(ta => ta.Subject)
            .FirstAsync(ta => ta.Id == id);
        return ToResponse(entity);
    }

    private static TeachingAssignmentResponse ToResponse(TeachingAssignment ta) => new()
    {
        Id = ta.Id,
        TeacherId = ta.TeacherId,
        TeacherName = ta.Teacher.Name,
        ClassId = ta.ClassId,
        ClassName = $"{ta.Class.Name} - {ta.Class.Section}",
        SubjectId = ta.SubjectId,
        SubjectName = ta.Subject.Name,
        CreatedAt = ta.CreatedAt
    };
}
