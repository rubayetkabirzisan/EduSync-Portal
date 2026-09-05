using AssignmentSystem.Application.DTOs.Notices;
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

public class NoticeService : INoticeService
{
    private readonly AppDbContext _context;

    public NoticeService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<NoticeDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var notice = await _context.Notices
            .Include(n => n.CreatedBy)
            .FirstOrDefaultAsync(n => n.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Notice with ID {id} not found.");

        return MapToDto(notice);
    }

    public async Task<IEnumerable<NoticeDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var notices = await _context.Notices
            .Include(n => n.CreatedBy)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync(cancellationToken);

        return notices.Select(MapToDto);
    }

    public async Task<IEnumerable<NoticeDto>> GetForUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken)
            ?? throw new KeyNotFoundException("User not found.");

        var audiences = new List<NoticeAudience> { NoticeAudience.All };
        if (user.Role == UserRole.Teacher) audiences.Add(NoticeAudience.Teachers);
        if (user.Role == UserRole.Student) audiences.Add(NoticeAudience.Students);

        var notices = await _context.Notices
            .Include(n => n.CreatedBy)
            .Where(n => audiences.Contains(n.Audience) || n.CreatedById == userId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync(cancellationToken);

        return notices.Select(MapToDto);
    }

    public async Task<NoticeDto> CreateAsync(CreateNoticeDto dto, Guid createdById, CancellationToken cancellationToken = default)
    {
        var notice = new Notice
        {
            Title = dto.Title,
            Content = dto.Content,
            Audience = dto.Audience,
            CreatedById = createdById
        };

        _context.Notices.Add(notice);
        await _context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(notice.Id, cancellationToken);
    }

    public async Task UpdateAsync(Guid id, UpdateNoticeDto dto, CancellationToken cancellationToken = default)
    {
        var notice = await _context.Notices.FindAsync(new object[] { id }, cancellationToken)
            ?? throw new KeyNotFoundException($"Notice with ID {id} not found.");

        if (dto.Title != null) notice.Title = dto.Title;
        if (dto.Content != null) notice.Content = dto.Content;
        if (dto.Audience.HasValue) notice.Audience = dto.Audience.Value;

        notice.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var notice = await _context.Notices.FindAsync(new object[] { id }, cancellationToken)
            ?? throw new KeyNotFoundException($"Notice with ID {id} not found.");

        _context.Notices.Remove(notice);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private static NoticeDto MapToDto(Notice n) => new()
    {
        Id = n.Id,
        Title = n.Title,
        Content = n.Content,
        Audience = n.Audience,
        CreatedById = n.CreatedById,
        CreatedByName = n.CreatedBy?.Name ?? string.Empty,
        CreatedAt = n.CreatedAt,
        UpdatedAt = n.UpdatedAt
    };
}
