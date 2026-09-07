using AssignmentSystem.Api.Hubs;
using AssignmentSystem.Application.DTOs.Common;
using AssignmentSystem.Application.DTOs.Notifications;
using AssignmentSystem.Application.Interfaces;
using AssignmentSystem.Domain.Entities;
using AssignmentSystem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace AssignmentSystem.Api.Services;

public class LiveNotificationService : ILiveNotificationService
{
    private readonly AppDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;

    public LiveNotificationService(AppDbContext context, IHubContext<NotificationHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    public async Task SendNotificationAsync(Guid userId, string title, string message, CancellationToken cancellationToken = default)
    {
        // 1. Save to database for persistence (offline users)
        var notification = new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            IsRead = false
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync(cancellationToken);

        // 2. Push via SignalR WebSockets (online users)
        await _hubContext.Clients.Group(userId.ToString()).SendAsync("ReceiveNotification", new
        {
            id = notification.Id,
            title = notification.Title,
            message = notification.Message,
            createdAt = notification.CreatedAt
        }, cancellationToken);
    }

    public async Task<PagedResponse<NotificationDto>> GetForUserAsync(
        Guid userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = _context.Notifications
            .AsNoTracking()
            .Where(notification => notification.UserId == userId);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(notification => notification.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(notification => new NotificationDto
            {
                Id = notification.Id,
                UserId = notification.UserId,
                Title = notification.Title,
                Message = notification.Message,
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResponse<NotificationDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task MarkAsReadAsync(
        Guid notificationId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(
                item => item.Id == notificationId && item.UserId == userId,
                cancellationToken)
            ?? throw new KeyNotFoundException($"Notification with ID {notificationId} not found.");

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task MarkAllAsReadAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        await _context.Notifications
            .Where(notification => notification.UserId == userId && !notification.IsRead)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(notification => notification.IsRead, true),
                cancellationToken);
    }
}
