using AssignmentSystem.Application.DTOs.Attendance;
using AssignmentSystem.Application.Interfaces;
using AssignmentSystem.Domain.Entities;
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
    private readonly AppDbContext _context;

    public AttendanceService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<AttendanceDto>> GetByStudentAsync(Guid studentId, CancellationToken cancellationToken = default)
    {
        var attendances = await _context.Attendances
            .Include(a => a.Student)
            .Include(a => a.Subject)
            .Where(a => a.StudentId == studentId)
            .OrderByDescending(a => a.Date)
            .ToListAsync(cancellationToken);

        return attendances.Select(MapToDto);
    }

    public async Task<IEnumerable<AttendanceDto>> GetBySubjectAsync(Guid subjectId, DateTime date, CancellationToken cancellationToken = default)
    {
        var targetDate = date.Date; // Strip time

        var attendances = await _context.Attendances
            .Include(a => a.Student)
            .Include(a => a.Subject)
            .Where(a => a.SubjectId == subjectId && a.Date.Date == targetDate)
            .ToListAsync(cancellationToken);

        return attendances.Select(MapToDto);
    }

    public async Task MarkAttendanceAsync(CreateAttendanceDto dto, CancellationToken cancellationToken = default)
    {
        var targetDate = dto.Date.Date;

        // Verify Subject exists
        var subject = await _context.Subjects.FindAsync(new object[] { dto.SubjectId }, cancellationToken)
            ?? throw new KeyNotFoundException("Subject not found.");

        foreach (var record in dto.Records)
        {
            // Check if student's class is taught this subject
            var student = await _context.Users.FindAsync(new object[] { record.StudentId }, cancellationToken);
            if (student == null || student.ClassId == null) continue;

            var isEnrolled = await _context.TeachingAssignments
                .AnyAsync(ta => ta.ClassId == student.ClassId && ta.SubjectId == dto.SubjectId, cancellationToken);
                
            if (!isEnrolled) continue; // Skip students whose class doesn't take this subject

            // Check if record already exists for this date and subject
            var existingRecord = await _context.Attendances
                .FirstOrDefaultAsync(a => a.StudentId == record.StudentId && 
                                          a.SubjectId == dto.SubjectId && 
                                          a.Date.Date == targetDate, cancellationToken);

            if (existingRecord != null)
            {
                // Update existing
                existingRecord.IsPresent = record.IsPresent;
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
                    IsPresent = record.IsPresent,
                    Remarks = record.Remarks
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    private static AttendanceDto MapToDto(Attendance a) => new()
    {
        Id = a.Id,
        StudentId = a.StudentId,
        StudentName = a.Student?.Name ?? string.Empty,
        SubjectId = a.SubjectId,
        SubjectName = a.Subject?.Name ?? string.Empty,
        Date = a.Date,
        IsPresent = a.IsPresent,
        Remarks = a.Remarks
    };
}
