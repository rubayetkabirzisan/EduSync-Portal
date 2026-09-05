using AssignmentSystem.Application.DTOs.Notices;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace AssignmentSystem.Application.Interfaces;

public interface INoticeService
{
    Task<NoticeDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<NoticeDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<NoticeDto>> GetForUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<NoticeDto> CreateAsync(CreateNoticeDto dto, Guid createdById, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid id, UpdateNoticeDto dto, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
