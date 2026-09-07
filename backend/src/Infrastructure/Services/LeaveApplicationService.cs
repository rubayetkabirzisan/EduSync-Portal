using AssignmentSystem.Application.DTOs.Leaves;
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

public class LeaveApplicationService : ILeaveApplicationService
{
    private readonly AppDbContext _context;
    private readonly ILiveNotificationService _notificationService;

    public LeaveApplicationService(AppDbContext context, ILiveNotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<LeaveApplicationDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var leave = await _context.LeaveApplications
            .Include(l => l.Student)
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Leave Application with ID {id} not found.");

        return MapToDto(leave);
    }

    public async Task<IEnumerable<LeaveApplicationDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var leaves = await _context.LeaveApplications
            .Include(l => l.Student)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync(cancellationToken);

        return leaves.Select(MapToDto);
    }

    public async Task<IEnumerable<LeaveApplicationDto>> GetForStudentAsync(Guid studentId, CancellationToken cancellationToken = default)
    {
        var leaves = await _context.LeaveApplications
            .Include(l => l.Student)
            .Where(l => l.StudentId == studentId)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync(cancellationToken);

        return leaves.Select(MapToDto);
    }

    public async Task<LeaveApplicationDto> CreateAsync(CreateLeaveApplicationDto dto, Guid studentId, CancellationToken cancellationToken = default)
    {
        ValidateLeaveDetails(dto);

        var student = await _context.Users.FindAsync(new object[] { studentId }, cancellationToken)
            ?? throw new KeyNotFoundException("Student not found.");

        if (student.Role != UserRole.Student)
            throw new UnauthorizedAccessException("Only students can apply for leaves.");

        var leave = new LeaveApplication
        {
            StudentId = studentId,
            Reason = dto.Reason,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            Status = LeaveStatus.Pending
        };

        _context.LeaveApplications.Add(leave);
        await _context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(leave.Id, cancellationToken);
    }

    public async Task UpdateOwnAsync(
        Guid id,
        Guid studentId,
        CreateLeaveApplicationDto dto,
        CancellationToken cancellationToken = default)
    {
        ValidateLeaveDetails(dto);

        var leave = await _context.LeaveApplications
            .FirstOrDefaultAsync(
                application => application.Id == id && application.StudentId == studentId,
                cancellationToken)
            ?? throw new KeyNotFoundException($"Leave Application with ID {id} not found.");

        if (leave.Status != LeaveStatus.Pending)
            throw new InvalidOperationException("Only pending leave applications can be edited.");

        leave.Reason = dto.Reason.Trim();
        leave.StartDate = dto.StartDate;
        leave.EndDate = dto.EndDate;
        leave.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateStatusAsync(Guid id, UpdateLeaveApplicationDto dto, CancellationToken cancellationToken = default)
    {
        var leave = await _context.LeaveApplications.FindAsync(new object[] { id }, cancellationToken)
            ?? throw new KeyNotFoundException($"Leave Application with ID {id} not found.");

        leave.Status = dto.Status;
        if (dto.AdminFeedback != null)
            leave.AdminFeedback = dto.AdminFeedback;
            
        leave.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        // Notify the student
        await _notificationService.SendNotificationAsync(
            leave.StudentId,
            "Leave Application Update",
            $"Your leave application from {leave.StartDate:d} to {leave.EndDate:d} is now {dto.Status}.",
            cancellationToken
        );
    }

    private static LeaveApplicationDto MapToDto(LeaveApplication l) => new()
    {
        Id = l.Id,
        StudentId = l.StudentId,
        StudentName = l.Student?.Name ?? string.Empty,
        Reason = l.Reason,
        StartDate = l.StartDate,
        EndDate = l.EndDate,
        Status = l.Status,
        AdminFeedback = l.AdminFeedback,
        CreatedAt = l.CreatedAt,
        UpdatedAt = l.UpdatedAt
    };

    private static void ValidateLeaveDetails(CreateLeaveApplicationDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Reason))
            throw new InvalidOperationException("A reason for leave is required.");

        if (dto.EndDate.Date < dto.StartDate.Date)
            throw new InvalidOperationException("The end date cannot be before the start date.");
    }
}
