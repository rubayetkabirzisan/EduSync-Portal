using System;
using System.Threading;
using System.Threading.Tasks;
using AssignmentSystem.Application.DTOs.Common;
using AssignmentSystem.Application.DTOs.Notifications;

namespace AssignmentSystem.Application.Interfaces;

public interface ILiveNotificationService
{
    Task SendNotificationAsync(Guid userId, string title, string message, CancellationToken cancellationToken = default);
    Task<PagedResponse<NotificationDto>> GetForUserAsync(Guid userId, int page, int pageSize, CancellationToken cancellationToken = default);
    Task MarkAsReadAsync(Guid notificationId, Guid userId, CancellationToken cancellationToken = default);
    Task MarkAllAsReadAsync(Guid userId, CancellationToken cancellationToken = default);
}
