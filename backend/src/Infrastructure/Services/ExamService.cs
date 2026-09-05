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
        if (dto.StartTime >= dto.EndTime)
            throw new InvalidOperationException("End time must be after start time.");

        // CONFLICT DETECTION: Check Room availability
        var roomConflict = await _context.Exams
            .AnyAsync(e => e.RoomNumber == dto.RoomNumber && 
                           e.StartTime < dto.EndTime && 
                           e.EndTime > dto.StartTime, cancellationToken);
                           
        if (roomConflict)
            throw new InvalidOperationException($"Room {dto.RoomNumber} is already booked during this time.");

        // CONFLICT DETECTION: Check Class availability (a class cannot take two exams at the same time)
        var classConflict = await _context.Exams
            .AnyAsync(e => e.ClassId == dto.ClassId && 
                           e.StartTime < dto.EndTime && 
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
            EndTime = dto.EndTime,
            RoomNumber = dto.RoomNumber
        };

        _context.Exams.Add(exam);
        await _context.SaveChangesAsync(cancellationToken);

        // Load navigation properties for DTO mapping
        exam.Class = classEntity;
        exam.Subject = subjectEntity;

        return MapToDto(exam);
    }

    private static ExamDto MapToDto(Exam e) => new()
    {
        Id = e.Id,
        Title = e.Title,
        ClassId = e.ClassId,
        ClassName = e.Class?.Name ?? string.Empty,
        SubjectId = e.SubjectId,
        SubjectName = e.Subject?.Name ?? string.Empty,
        StartTime = e.StartTime,
        EndTime = e.EndTime,
        RoomNumber = e.RoomNumber
    };
}
