using AssignmentSystem.Application.DTOs.Notices;
using AssignmentSystem.Application.Interfaces;
using AssignmentSystem.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AssignmentSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NoticesController : ControllerBase
{
    private readonly INoticeService _noticeService;

    public NoticesController(INoticeService noticeService)
    {
        _noticeService = noticeService;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotices(CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var notices = await _noticeService.GetForUserAsync(userId, cancellationToken);
        return Ok(notices);
    }

    [HttpGet("all")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> GetAllNotices(CancellationToken cancellationToken)
    {
        var notices = await _noticeService.GetAllAsync(cancellationToken);
        return Ok(notices);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetNotice(Guid id, CancellationToken cancellationToken)
    {
        var notice = await _noticeService.GetByIdAsync(id, cancellationToken);
        return Ok(notice);
    }

    [HttpPost]
    [Authorize(Roles = $"{nameof(UserRole.Admin)},{nameof(UserRole.Teacher)}")]
    public async Task<IActionResult> CreateNotice(CreateNoticeDto dto, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var notice = await _noticeService.CreateAsync(dto, userId, cancellationToken);
        return CreatedAtAction(nameof(GetNotice), new { id = notice.Id }, notice);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = $"{nameof(UserRole.Admin)},{nameof(UserRole.Teacher)}")]
    public async Task<IActionResult> UpdateNotice(Guid id, UpdateNoticeDto dto, CancellationToken cancellationToken)
    {
        await _noticeService.UpdateAsync(id, dto, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = $"{nameof(UserRole.Admin)},{nameof(UserRole.Teacher)}")]
    public async Task<IActionResult> DeleteNotice(Guid id, CancellationToken cancellationToken)
    {
        await _noticeService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
