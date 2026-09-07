using AssignmentSystem.Application.DTOs.Exams;
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

public class ExamService : IExamService
{
    private readonly AppDbContext _context;

    public ExamService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ExamDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var exam = await _context.Exams
            .Include(e => e.Class)
            .Include(e => e.Subject)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Exam not found.");

        return MapToDto(exam);
    }

    public async Task<IEnumerable<ExamDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var exams = await _context.Exams
            .Include(e => e.Class)
            .Include(e => e.Subject)
            .OrderBy(e => e.StartTime)
            .ToListAsync(cancellationToken);

        return exams.Select(MapToDto);
    }

    public async Task<ExamDto> CreateAsync(CreateExamDto dto, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
            throw new InvalidOperationException("Exam title is required.");

        if (dto.DurationMinutes < 15)
            throw new InvalidOperationException("Exam duration must be at least 15 minutes.");

        if (dto.MaxMarks < 1)
            throw new InvalidOperationException("Maximum marks must be at least 1.");

        if (string.IsNullOrWhiteSpace(dto.RoomName))
            throw new InvalidOperationException("Room or location is required.");

        var endTime = dto.StartTime.AddMinutes(dto.DurationMinutes);

        // CONFLICT DETECTION: Check Room availability
        var roomConflict = await _context.Exams
            .AnyAsync(e => e.RoomNumber == dto.RoomName.Trim() &&
                           e.StartTime < endTime &&
                           e.EndTime > dto.StartTime, cancellationToken);

        if (roomConflict)
            throw new InvalidOperationException($"Room {dto.RoomName.Trim()} is already booked during this time.");

        // CONFLICT DETECTION: Check Class availability (a class cannot take two exams at the same time)
        var classConflict = await _context.Exams
            .AnyAsync(e => e.ClassId == dto.ClassId &&
                           e.StartTime < endTime &&
                           e.EndTime > dto.StartTime, cancellationToken);

        if (classConflict)
            throw new InvalidOperationException("This class already has an exam scheduled during this time.");

        // Verify entities exist
        var classEntity = await _context.Classes.FindAsync(new object[] { dto.ClassId }, cancellationToken)
            ?? throw new KeyNotFoundException("Class not found.");
            
        var subjectEntity = await _context.Subjects.FindAsync(new object[] { dto.SubjectId }, cancellationToken)
            ?? throw new KeyNotFoundException("Subject not found.");

        var exam = new Exam
        {
            Title = dto.Title,
            ClassId = dto.ClassId,
            SubjectId = dto.SubjectId,
            StartTime = dto.StartTime,
            EndTime = endTime,
            MaxMarks = dto.MaxMarks,
            RoomNumber = dto.RoomName.Trim()
        };

        _context.Exams.Add(exam);
        await _context.SaveChangesAsync(cancellationToken);

        // Load navigation properties for DTO mapping
        exam.Class = classEntity;
        exam.Subject = subjectEntity;

        return MapToDto(exam);
    }

    public async Task<ExamDto> UpdateAsync(Guid id, CreateExamDto dto, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
            throw new InvalidOperationException("Exam title is required.");

        if (dto.DurationMinutes < 15)
            throw new InvalidOperationException("Exam duration must be at least 15 minutes.");

        if (dto.MaxMarks < 1)
            throw new InvalidOperationException("Maximum marks must be at least 1.");

        if (string.IsNullOrWhiteSpace(dto.RoomName))
            throw new InvalidOperationException("Room or location is required.");

        var exam = await _context.Exams.FindAsync(new object[] { id }, cancellationToken)
            ?? throw new KeyNotFoundException("Exam not found.");
        var endTime = dto.StartTime.AddMinutes(dto.DurationMinutes);
        var roomName = dto.RoomName.Trim();

        var roomConflict = await _context.Exams.AnyAsync(e =>
            e.Id != id &&
            e.RoomNumber == roomName &&
            e.StartTime < endTime &&
            e.EndTime > dto.StartTime,
            cancellationToken);

        if (roomConflict)
            throw new InvalidOperationException($"Room {roomName} is already booked during this time.");

        var classConflict = await _context.Exams.AnyAsync(e =>
            e.Id != id &&
            e.ClassId == dto.ClassId &&
            e.StartTime < endTime &&
            e.EndTime > dto.StartTime,
            cancellationToken);

        if (classConflict)
            throw new InvalidOperationException("This class already has an exam scheduled during this time.");

        var classEntity = await _context.Classes.FindAsync(new object[] { dto.ClassId }, cancellationToken)
            ?? throw new KeyNotFoundException("Class not found.");
        var subjectEntity = await _context.Subjects.FindAsync(new object[] { dto.SubjectId }, cancellationToken)
            ?? throw new KeyNotFoundException("Subject not found.");

        exam.Title = dto.Title.Trim();
        exam.ClassId = dto.ClassId;
        exam.SubjectId = dto.SubjectId;
        exam.StartTime = dto.StartTime;
        exam.EndTime = endTime;
        exam.MaxMarks = dto.MaxMarks;
        exam.RoomNumber = roomName;

        await _context.SaveChangesAsync(cancellationToken);

        exam.Class = classEntity;
        exam.Subject = subjectEntity;
        return MapToDto(exam);
    }

    private static ExamDto MapToDto(Exam e) => new()
    {
        Id = e.Id,
        Title = e.Title,
        ClassId = e.ClassId,
        ClassName = e.Class is null
            ? string.Empty
            : $"{e.Class.Name}{(string.IsNullOrWhiteSpace(e.Class.Section) ? string.Empty : $" - {e.Class.Section}")}",
        SubjectId = e.SubjectId,
        SubjectName = e.Subject?.Name ?? string.Empty,
        StartTime = e.StartTime,
        DurationMinutes = (int)(e.EndTime - e.StartTime).TotalMinutes,
        MaxMarks = e.MaxMarks,
        RoomName = e.RoomNumber,
        CreatedAt = e.CreatedAt
    };
}
