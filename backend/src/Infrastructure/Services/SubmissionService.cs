using AssignmentSystem.Application.DTOs.Common;
using AssignmentSystem.Application.DTOs.Submissions;
using AssignmentSystem.Application.Interfaces;
using AssignmentSystem.Domain.Entities;
using AssignmentSystem.Domain.Enums;
using AssignmentSystem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystem.Infrastructure.Services;

public class SubmissionService : ISubmissionService
{
    private readonly AppDbContext _db;

    public SubmissionService(AppDbContext db) => _db = db;

    public async Task<SubmissionResponse> CreateAsync(Guid studentId, CreateSubmissionRequest request)
    {
        var student = await _db.Users.FindAsync(studentId)
            ?? throw new InvalidOperationException("Student not found.");

        var assignment = await _db.Assignments.FindAsync(request.AssignmentId)
            ?? throw new InvalidOperationException("Assignment not found.");

        // Must be published
        if (assignment.Status != AssignmentStatus.Published)
            throw new InvalidOperationException("This assignment is not published yet.");

        // Student must belong to the assignment's class
        if (student.ClassId != assignment.ClassId)
            throw new UnauthorizedAccessException("This assignment is not for your class.");

        // Check for existing submission
        var existing = await _db.Submissions.FirstOrDefaultAsync(s =>
            s.AssignmentId == request.AssignmentId && s.StudentId == studentId);

        if (existing is not null)
            throw new InvalidOperationException(
                "You have already submitted. Use the update endpoint to modify your submission.");

        // Determine status (late detection)
        var isLate = DateTime.UtcNow > assignment.Deadline;
        var status = isLate ? SubmissionStatus.Late : SubmissionStatus.Submitted;

        var entity = new Submission
        {
            AssignmentId = request.AssignmentId,
            StudentId = studentId,
            Content = request.Content,
            Status = status,
            SubmittedAt = DateTime.UtcNow
        };

        _db.Submissions.Add(entity);
        await _db.SaveChangesAsync();

        return await MapToResponse(entity.Id);
    }

    public async Task<SubmissionResponse?> UpdateAsync(Guid id, Guid studentId, UpdateSubmissionRequest request)
    {
        var submission = await _db.Submissions
            .Include(s => s.Assignment)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (submission is null) return null;

        // Must be the student's own submission
        if (submission.StudentId != studentId)
            throw new UnauthorizedAccessException("You can only update your own submission.");

        // Check if resubmission is allowed
        if (!submission.Assignment.AllowResubmission)
            throw new InvalidOperationException(
                "Resubmission is not allowed for this assignment.");

        // Check deadline
        if (DateTime.UtcNow > submission.Assignment.Deadline)
            throw new InvalidOperationException(
                "The deadline has passed. You cannot update your submission.");

        // Cannot update if already graded
        if (submission.Status == SubmissionStatus.Graded)
            throw new InvalidOperationException(
                "Your submission has already been graded and cannot be updated.");

        submission.Content = request.Content;
        submission.UpdatedAt = DateTime.UtcNow;
        // Reset status if it was NeedsRevision
        if (submission.Status == SubmissionStatus.NeedsRevision)
            submission.Status = SubmissionStatus.Submitted;

        await _db.SaveChangesAsync();

        return await MapToResponse(submission.Id);
    }

    public async Task<PagedResponse<SubmissionResponse>> GetStudentSubmissionsAsync(Guid studentId, SubmissionListFilter filter)
    {
        var query = FullQuery().Where(s => s.StudentId == studentId);

        query = ApplyFilters(query, filter);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(s => s.SubmittedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return new PagedResponse<SubmissionResponse>
        {
            Items = items.Select(ToResponse).ToList(),
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalCount = totalCount
        };
    }

    public async Task<PagedResponse<SubmissionResponse>> GetTeacherSubmissionsAsync(
        Guid teacherId, SubmissionListFilter filter)
    {
        var query = FullQuery().Where(s => s.Assignment.TeacherId == teacherId);
        query = ApplyFilters(query, filter);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(s => s.SubmittedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return new PagedResponse<SubmissionResponse>
        {
            Items = items.Select(ToResponse).ToList(),
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalCount = totalCount
        };
    }

    public async Task<PagedResponse<SubmissionResponse>> GetAssignmentSubmissionsAsync(
        Guid assignmentId, Guid teacherId, SubmissionListFilter filter)
    {
        // Verify teacher owns this assignment
        var assignment = await _db.Assignments.FindAsync(assignmentId);
        if (assignment is null)
            throw new InvalidOperationException("Assignment not found.");
        if (assignment.TeacherId != teacherId)
            throw new UnauthorizedAccessException("You can only view submissions for your own assignments.");

        var query = FullQuery().Where(s => s.AssignmentId == assignmentId);
        query = ApplyFilters(query, filter);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(s => s.SubmittedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return new PagedResponse<SubmissionResponse>
        {
            Items = items.Select(ToResponse).ToList(),
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalCount = totalCount
        };
    }

    public async Task<SubmissionResponse?> GradeAsync(Guid id, Guid teacherId, GradeSubmissionRequest request)
    {
        var submission = await _db.Submissions
            .Include(s => s.Assignment)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (submission is null) return null;

        // Only the assignment's teacher can grade
        if (submission.Assignment.TeacherId != teacherId)
            throw new UnauthorizedAccessException("You can only grade submissions for your own assignments.");

        // Validate marks are within range
        if (request.Marks > submission.Assignment.MaxMarks)
            throw new InvalidOperationException(
                $"Marks ({request.Marks}) cannot exceed the maximum ({submission.Assignment.MaxMarks}).");

        submission.Marks = request.Marks;
        submission.Feedback = request.Feedback;
        submission.Status = SubmissionStatus.Graded;
        submission.GradedAt = DateTime.UtcNow;
        submission.GradedByTeacherId = teacherId;
        submission.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return await MapToResponse(submission.Id);
    }

    public async Task<SubmissionResponse?> ChangeStatusAsync(Guid id, Guid teacherId, ChangeSubmissionStatusRequest request)
    {
        var submission = await _db.Submissions
            .Include(s => s.Assignment)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (submission is null) return null;

        if (submission.Assignment.TeacherId != teacherId)
            throw new UnauthorizedAccessException("You can only change status for submissions to your own assignments.");

        if (!Enum.TryParse<SubmissionStatus>(request.Status, out var newStatus))
            throw new InvalidOperationException($"Invalid status value: '{request.Status}'.");

        // Only allow non-grading transitions — grading must go through the Grade endpoint
        var allowed = new[] { SubmissionStatus.UnderReview, SubmissionStatus.NeedsRevision };
        if (!allowed.Contains(newStatus))
            throw new InvalidOperationException(
                "Status can only be changed to 'UnderReview' or 'NeedsRevision'. Use the grade endpoint to mark as Graded.");

        submission.Status = newStatus;
        submission.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return await MapToResponse(submission.Id);
    }

    public async Task<SubmissionResponse?> GetByIdAsync(Guid id)
    {
        var entity = await FullQuery().FirstOrDefaultAsync(s => s.Id == id);
        return entity is null ? null : ToResponse(entity);
    }

    public async Task<PagedResponse<SubmissionResponse>> GetAllAsync(SubmissionListFilter filter)
    {
        var query = FullQuery();
        query = ApplyFilters(query, filter);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(s => s.SubmittedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return new PagedResponse<SubmissionResponse>
        {
            Items = items.Select(ToResponse).ToList(),
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalCount = totalCount
        };
    }

    private IQueryable<Submission> FullQuery() => _db.Submissions
        .Include(s => s.Assignment)
        .Include(s => s.Student);

    private static IQueryable<Submission> ApplyFilters(IQueryable<Submission> query, SubmissionListFilter filter)
    {
        if (!string.IsNullOrEmpty(filter.Status) && Enum.TryParse<SubmissionStatus>(filter.Status, out var status))
            query = query.Where(s => s.Status == status);
        if (filter.AssignmentId.HasValue)
            query = query.Where(s => s.AssignmentId == filter.AssignmentId.Value);
        if (filter.StudentId.HasValue)
            query = query.Where(s => s.StudentId == filter.StudentId.Value);
        return query;
    }

    private async Task<SubmissionResponse> MapToResponse(Guid id)
    {
        var entity = await FullQuery().FirstAsync(s => s.Id == id);
        return ToResponse(entity);
    }

    private static SubmissionResponse ToResponse(Submission s) => new()
    {
        Id = s.Id,
        AssignmentId = s.AssignmentId,
        AssignmentTitle = s.Assignment.Title,
        StudentId = s.StudentId,
        StudentName = s.Student.Name,
        Content = s.Content,
        Status = s.Status.ToString(),
        Marks = s.Marks,
        MaxMarks = s.Assignment.MaxMarks,
        Feedback = s.Feedback,
        SubmittedAt = s.SubmittedAt,
        UpdatedAt = s.UpdatedAt,
        GradedAt = s.GradedAt
    };
}
