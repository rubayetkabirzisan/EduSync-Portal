using AssignmentSystem.Application.DTOs.Assignments;
using AssignmentSystem.Application.DTOs.Common;
using AssignmentSystem.Application.Interfaces;
using AssignmentSystem.Domain.Entities;
using AssignmentSystem.Domain.Enums;
using AssignmentSystem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystem.Infrastructure.Services;

public class AssignmentService : IAssignmentService
{
    private readonly AppDbContext _db;

    public AssignmentService(AppDbContext db) => _db = db;

    public async Task<AssignmentResponse> CreateAsync(Guid teacherId, CreateAssignmentRequest request)
    {
        // Verify teacher is assigned to this class+subject
        var isAuthorized = await _db.TeachingAssignments.AnyAsync(ta =>
            ta.TeacherId == teacherId &&
            ta.ClassId == request.ClassId &&
            ta.SubjectId == request.SubjectId);

        if (!isAuthorized)
            throw new UnauthorizedAccessException(
                "You are not assigned to teach this subject for this class.");

        var entity = new Assignment
        {
            Title = request.Title,
            Description = request.Description,
            Deadline = request.Deadline,
            MaxMarks = request.MaxMarks,
            ClassId = request.ClassId,
            SubjectId = request.SubjectId,
            TeacherId = teacherId,
            AllowResubmission = request.AllowResubmission,
            Status = request.PublishImmediately ? AssignmentStatus.Published : AssignmentStatus.Draft
        };

        _db.Assignments.Add(entity);
        await _db.SaveChangesAsync();

        return await MapToResponse(entity.Id);
    }

    public async Task<AssignmentResponse?> GetByIdAsync(Guid id)
    {
        var entity = await FullQuery().FirstOrDefaultAsync(a => a.Id == id);
        return entity is null ? null : ToResponse(entity);
    }

    public async Task<AssignmentResponse?> UpdateAsync(Guid id, Guid teacherId, UpdateAssignmentRequest request)
    {
        var entity = await _db.Assignments.FindAsync(id);
        if (entity is null) return null;

        if (entity.TeacherId != teacherId)
            throw new UnauthorizedAccessException("Only the assignment creator can edit it.");

        if (request.Title is not null) entity.Title = request.Title;
        if (request.Description is not null) entity.Description = request.Description;
        if (request.Deadline.HasValue) entity.Deadline = request.Deadline.Value;
        if (request.MaxMarks.HasValue) entity.MaxMarks = request.MaxMarks.Value;
        if (request.AllowResubmission.HasValue) entity.AllowResubmission = request.AllowResubmission.Value;

        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await MapToResponse(entity.Id);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid teacherId)
    {
        var entity = await _db.Assignments.FindAsync(id);
        if (entity is null) return false;

        if (entity.TeacherId != teacherId)
            throw new UnauthorizedAccessException("Only the assignment creator can delete it.");

        _db.Assignments.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<AssignmentResponse?> PublishAsync(Guid id, Guid teacherId)
    {
        var entity = await _db.Assignments.FindAsync(id);
        if (entity is null) return null;

        if (entity.TeacherId != teacherId)
            throw new UnauthorizedAccessException("Only the assignment creator can publish it.");

        if (entity.Status == AssignmentStatus.Published)
            throw new InvalidOperationException("Assignment is already published.");

        entity.Status = AssignmentStatus.Published;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await MapToResponse(entity.Id);
    }

    public async Task<PagedResponse<AssignmentResponse>> GetAllAsync(AssignmentListFilter filter, Guid? teacherId = null)
    {
        var query = FullQuery();

        if (teacherId.HasValue)
            query = query.Where(a => a.TeacherId == teacherId.Value);

        query = ApplyFilters(query, filter);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return new PagedResponse<AssignmentResponse>
        {
            Items = items.Select(ToResponse).ToList(),
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalCount = totalCount
        };
    }

    public async Task<PagedResponse<AssignmentResponse>> GetStudentAssignmentsAsync(Guid studentId, AssignmentListFilter filter)
    {
        var student = await _db.Users.FindAsync(studentId);
        if (student?.ClassId is null)
            return new PagedResponse<AssignmentResponse> { Page = filter.Page, PageSize = filter.PageSize };

        // Students only see published assignments for their class
        var query = FullQuery()
            .Where(a => a.ClassId == student.ClassId && a.Status == AssignmentStatus.Published);

        query = ApplyFilters(query, filter);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(a => a.Deadline)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return new PagedResponse<AssignmentResponse>
        {
            Items = items.Select(ToResponse).ToList(),
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalCount = totalCount
        };
    }

    private IQueryable<Assignment> FullQuery() => _db.Assignments
        .Include(a => a.Class)
        .Include(a => a.Subject)
        .Include(a => a.Teacher)
        .Include(a => a.Submissions);

    private static IQueryable<Assignment> ApplyFilters(IQueryable<Assignment> query, AssignmentListFilter filter)
    {
        if (!string.IsNullOrEmpty(filter.Status) && Enum.TryParse<AssignmentStatus>(filter.Status, out var status))
            query = query.Where(a => a.Status == status);
        if (filter.ClassId.HasValue)
            query = query.Where(a => a.ClassId == filter.ClassId.Value);
        if (filter.SubjectId.HasValue)
            query = query.Where(a => a.SubjectId == filter.SubjectId.Value);
        if (!string.IsNullOrEmpty(filter.Search))
            query = query.Where(a => a.Title.Contains(filter.Search));
        return query;
    }

    private async Task<AssignmentResponse> MapToResponse(Guid id)
    {
        var entity = await FullQuery().FirstAsync(a => a.Id == id);
        return ToResponse(entity);
    }

    private static AssignmentResponse ToResponse(Assignment a) => new()
    {
        Id = a.Id,
        Title = a.Title,
        Description = a.Description,
        Deadline = a.Deadline,
        MaxMarks = a.MaxMarks,
        Status = a.Status.ToString(),
        AllowResubmission = a.AllowResubmission,
        ClassId = a.ClassId,
        ClassName = a.Class.Name,
        SubjectId = a.SubjectId,
        SubjectName = a.Subject.Name,
        TeacherId = a.TeacherId,
        TeacherName = a.Teacher.Name,
        SubmissionCount = a.Submissions.Count,
        CreatedAt = a.CreatedAt,
        UpdatedAt = a.UpdatedAt
    };
}
