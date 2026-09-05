using AssignmentSystem.Application.DTOs.Scholarships;
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

public class ScholarshipService : IScholarshipService
{
    private readonly AppDbContext _context;
    private readonly ILiveNotificationService _notificationService;

    public ScholarshipService(AppDbContext context, ILiveNotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<ScholarshipDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var scholarship = await _context.Scholarships
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Scholarship with ID {id} not found.");

        return MapToDto(scholarship);
    }

    public async Task<IEnumerable<ScholarshipDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var scholarships = await _context.Scholarships
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);

        return scholarships.Select(MapToDto);
    }

    public async Task<ScholarshipDto> CreateAsync(CreateScholarshipDto dto, CancellationToken cancellationToken = default)
    {
        var scholarship = new Scholarship
        {
            Name = dto.Name,
            Description = dto.Description,
            Amount = dto.Amount,
            Deadline = dto.Deadline,
            IsActive = true
        };

        _context.Scholarships.Add(scholarship);
        await _context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(scholarship.Id, cancellationToken);
    }

    public async Task<ScholarshipApplicationDto> ApplyAsync(ApplyScholarshipDto dto, Guid studentId, CancellationToken cancellationToken = default)
    {
        var scholarship = await _context.Scholarships.FindAsync(new object[] { dto.ScholarshipId }, cancellationToken)
            ?? throw new KeyNotFoundException("Scholarship not found.");

        if (scholarship.Deadline < DateTime.UtcNow)
            throw new InvalidOperationException("Scholarship deadline has passed.");

        var existingApp = await _context.ScholarshipApplications
            .FirstOrDefaultAsync(a => a.ScholarshipId == dto.ScholarshipId && a.StudentId == studentId, cancellationToken);
        
        if (existingApp != null)
            throw new InvalidOperationException("You have already applied for this scholarship.");

        var application = new ScholarshipApplication
        {
            ScholarshipId = dto.ScholarshipId,
            StudentId = studentId,
            Reason = dto.Reason,
            Status = ScholarshipStatus.Pending
        };

        _context.ScholarshipApplications.Add(application);
        await _context.SaveChangesAsync(cancellationToken);

        var loadedApp = await _context.ScholarshipApplications
            .Include(a => a.Scholarship)
            .Include(a => a.Student)
            .FirstAsync(a => a.Id == application.Id, cancellationToken);

        return MapToAppDto(loadedApp);
    }

    public async Task<IEnumerable<ScholarshipApplicationDto>> GetApplicationsForScholarshipAsync(Guid scholarshipId, CancellationToken cancellationToken = default)
    {
        var applications = await _context.ScholarshipApplications
            .Include(a => a.Scholarship)
            .Include(a => a.Student)
            .Where(a => a.ScholarshipId == scholarshipId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(cancellationToken);

        return applications.Select(MapToAppDto);
    }

    public async Task<IEnumerable<ScholarshipApplicationDto>> GetMyApplicationsAsync(Guid studentId, CancellationToken cancellationToken = default)
    {
        var applications = await _context.ScholarshipApplications
            .Include(a => a.Scholarship)
            .Include(a => a.Student)
            .Where(a => a.StudentId == studentId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(cancellationToken);

        return applications.Select(MapToAppDto);
    }

    public async Task UpdateApplicationStatusAsync(Guid applicationId, UpdateScholarshipApplicationDto dto, CancellationToken cancellationToken = default)
    {
        var application = await _context.ScholarshipApplications
            .Include(a => a.Scholarship)
            .FirstOrDefaultAsync(a => a.Id == applicationId, cancellationToken)
            ?? throw new KeyNotFoundException("Application not found.");

        application.Status = dto.Status;
        if (dto.AdminFeedback != null)
            application.AdminFeedback = dto.AdminFeedback;
            
        application.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        // Notify the student
        await _notificationService.SendNotificationAsync(
            application.StudentId,
            "Scholarship Application Update",
            $"Your application for Scholarship '{application.Scholarship?.Name}' is now {dto.Status}.",
            cancellationToken
        );
    }

    private static ScholarshipDto MapToDto(Scholarship s) => new()
    {
        Id = s.Id,
        Name = s.Name,
        Description = s.Description,
        Amount = s.Amount,
        Deadline = s.Deadline,
        IsActive = s.IsActive,
        CreatedAt = s.CreatedAt
    };

    private static ScholarshipApplicationDto MapToAppDto(ScholarshipApplication a) => new()
    {
        Id = a.Id,
        ScholarshipId = a.ScholarshipId,
        ScholarshipName = a.Scholarship?.Name ?? string.Empty,
        StudentId = a.StudentId,
        StudentName = a.Student?.Name ?? string.Empty,
        Reason = a.Reason,
        Status = a.Status,
        AdminFeedback = a.AdminFeedback,
        CreatedAt = a.CreatedAt
    };
}
