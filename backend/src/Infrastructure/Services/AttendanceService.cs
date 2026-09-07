using AssignmentSystem.Application.DTOs.Attendance;
using AssignmentSystem.Application.Interfaces;
using AssignmentSystem.Domain.Entities;
using AssignmentSystem.Domain.Enums;
using AssignmentSystem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace AssignmentSystem.Infrastructure.Services;

public class AttendanceService : IAttendanceService
{
    private static readonly HashSet<string> AllowedStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "Present", "Late", "Excused", "Absent"
    };

    private readonly AppDbContext _context;

    public AttendanceService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<AttendanceDto>> GetByStudentAsync(Guid studentId, CancellationToken cancellationToken = default)
    {
        var attendances = await _context.Attendances
            .Include(a => a.Student)
                .ThenInclude(student => student.Class)
            .Include(a => a.Subject)
            .Where(a => a.StudentId == studentId)
            .OrderByDescending(a => a.Date)
            .ToListAsync(cancellationToken);

        return attendances.Select(MapToDto);
    }

    public async Task<IEnumerable<AttendanceRosterStudentDto>> GetRosterAsync(
        Guid classId,
        Guid subjectId,
        DateTime date,
        Guid actorUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        await EnsureCanManageAsync(classId, subjectId, actorUserId, isAdmin, cancellationToken);

        var students = await _context.Users
            .Where(user => user.Role == UserRole.Student && user.ClassId == classId)
            .OrderBy(user => user.Name)
            .Select(user => new { user.Id, user.Name, user.Email })
            .ToListAsync(cancellationToken);

        var studentIds = students.Select(student => student.Id).ToList();
        var (dayStart, dayEnd) = GetUtcDayRange(date);
        var savedRecords = await _context.Attendances
            .Where(record =>
                record.SubjectId == subjectId &&
                record.Date >= dayStart &&
                record.Date < dayEnd &&
                studentIds.Contains(record.StudentId))
            .Select(record => new { record.StudentId, record.Status, record.IsPresent })
            .ToListAsync(cancellationToken);

        var savedByStudent = savedRecords
            .GroupBy(record => record.StudentId)
            .ToDictionary(
                group => group.Key,
                group => NormaliseStatus(group.First().Status, group.First().IsPresent));

        return students.Select(student => new AttendanceRosterStudentDto
        {
            Id = student.Id,
            Name = student.Name,
            Email = student.Email,
            Status = savedByStudent.GetValueOrDefault(student.Id)
        });
    }

    public async Task<IEnumerable<AttendanceDto>> GetBySubjectAsync(Guid subjectId, DateTime date, CancellationToken cancellationToken = default)
    {
        var (dayStart, dayEnd) = GetUtcDayRange(date);

        var attendances = await _context.Attendances
            .Include(a => a.Student)
            .Include(a => a.Subject)
            .Where(a => a.SubjectId == subjectId && a.Date >= dayStart && a.Date < dayEnd)
            .ToListAsync(cancellationToken);

        return attendances.Select(MapToDto);
    }

    public async Task MarkAttendanceAsync(
        CreateAttendanceDto dto,
        Guid actorUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        await EnsureCanManageAsync(dto.ClassId, dto.SubjectId, actorUserId, isAdmin, cancellationToken);

        if (dto.Records.Count == 0)
            throw new InvalidOperationException("At least one student attendance record is required.");

        var records = dto.Records
            .GroupBy(record => record.StudentId)
            .Select(group => group.Last())
            .ToList();

        foreach (var record in records)
        {
            if (!AllowedStatuses.Contains(record.Status))
                throw new InvalidOperationException($"'{record.Status}' is not a valid attendance status.");
        }

        var requestedStudentIds = records.Select(record => record.StudentId).ToList();
        var validStudentIds = await _context.Users
            .Where(user =>
                requestedStudentIds.Contains(user.Id) &&
                user.Role == UserRole.Student &&
                user.ClassId == dto.ClassId)
            .Select(user => user.Id)
            .ToListAsync(cancellationToken);

        if (validStudentIds.Count != requestedStudentIds.Count)
            throw new InvalidOperationException("One or more selected students do not belong to this class.");

        var (targetDate, dayEnd) = GetUtcDayRange(dto.Date);
        var existingRecords = await _context.Attendances
            .Where(attendance =>
                requestedStudentIds.Contains(attendance.StudentId) &&
                attendance.SubjectId == dto.SubjectId &&
                attendance.Date >= targetDate &&
                attendance.Date < dayEnd)
            .ToListAsync(cancellationToken);

        foreach (var record in records)
        {
            var status = AllowedStatuses.First(allowed =>
                allowed.Equals(record.Status, StringComparison.OrdinalIgnoreCase));
            var countsAsPresent = status is "Present" or "Late";
            var existingRecord = existingRecords.FirstOrDefault(attendance =>
                attendance.StudentId == record.StudentId);

            if (existingRecord != null)
            {
                existingRecord.Status = status;
                existingRecord.IsPresent = countsAsPresent;
                existingRecord.Remarks = record.Remarks;
            }
            else
            {
                // Add new
                _context.Attendances.Add(new Attendance
                {
                    StudentId = record.StudentId,
                    SubjectId = dto.SubjectId,
                    Date = targetDate,
                    Status = status,
                    IsPresent = countsAsPresent,
                    Remarks = record.Remarks
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureCanManageAsync(
        Guid classId,
        Guid subjectId,
        Guid actorUserId,
        bool isAdmin,
        CancellationToken cancellationToken)
    {
        if (!await _context.Classes.AnyAsync(entity => entity.Id == classId, cancellationToken))
            throw new KeyNotFoundException("Class not found.");

        if (!await _context.Subjects.AnyAsync(entity => entity.Id == subjectId, cancellationToken))
            throw new KeyNotFoundException("Subject not found.");

        if (isAdmin)
            return;

        var isAssignedTeacher = await _context.TeachingAssignments.AnyAsync(assignment =>
            assignment.TeacherId == actorUserId &&
            assignment.ClassId == classId &&
            assignment.SubjectId == subjectId,
            cancellationToken);

        if (!isAssignedTeacher)
            throw new UnauthorizedAccessException("You are not assigned to this class and subject.");
    }

    private static string NormaliseStatus(string? status, bool isPresent) =>
        !string.IsNullOrWhiteSpace(status) && AllowedStatuses.Contains(status)
            ? AllowedStatuses.First(allowed => allowed.Equals(status, StringComparison.OrdinalIgnoreCase))
            : isPresent ? "Present" : "Absent";

    private static (DateTime Start, DateTime End) GetUtcDayRange(DateTime date)
    {
        var start = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        return (start, start.AddDays(1));
    }

    private static AttendanceDto MapToDto(Attendance a) => new()
    {
        Id = a.Id,
        StudentId = a.StudentId,
        StudentName = a.Student?.Name ?? string.Empty,
        ClassName = a.Student?.Class is null
            ? string.Empty
            : $"{a.Student.Class.Name}{(string.IsNullOrWhiteSpace(a.Student.Class.Section) ? string.Empty : $" - {a.Student.Class.Section}")}",
        SubjectId = a.SubjectId,
        SubjectName = a.Subject?.Name ?? string.Empty,
        Date = a.Date,
        Status = NormaliseStatus(a.Status, a.IsPresent),
        IsPresent = a.IsPresent,
        Remarks = a.Remarks
    };
}
