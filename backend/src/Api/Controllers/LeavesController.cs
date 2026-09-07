using AssignmentSystem.Application.DTOs.Leaves;
using AssignmentSystem.Application.Interfaces;
using AssignmentSystem.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AssignmentSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LeavesController : ControllerBase
{
    private readonly ILeaveApplicationService _leaveService;

    public LeavesController(ILeaveApplicationService leaveService)
    {
        _leaveService = leaveService;
    }

    [HttpGet("my-leaves")]
    [Authorize(Roles = nameof(UserRole.Student))]
    public async Task<IActionResult> GetMyLeaves(CancellationToken cancellationToken)
    {
        var studentId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var leaves = await _leaveService.GetForStudentAsync(studentId, cancellationToken);
        return Ok(leaves);
    }

    [HttpGet]
    [Authorize(Roles = $"{nameof(UserRole.Admin)},{nameof(UserRole.Teacher)}")]
    public async Task<IActionResult> GetAllLeaves(CancellationToken cancellationToken)
    {
        var leaves = await _leaveService.GetAllAsync(cancellationToken);
        return Ok(leaves);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetLeave(Guid id, CancellationToken cancellationToken)
    {
        var leave = await _leaveService.GetByIdAsync(id, cancellationToken);
        return Ok(leave);
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Student))]
    public async Task<IActionResult> ApplyForLeave(CreateLeaveApplicationDto dto, CancellationToken cancellationToken)
    {
        var studentId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var leave = await _leaveService.CreateAsync(dto, studentId, cancellationToken);
        return CreatedAtAction(nameof(GetLeave), new { id = leave.Id }, leave);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Student))]
    public async Task<IActionResult> UpdateMyLeave(Guid id, CreateLeaveApplicationDto dto, CancellationToken cancellationToken)
    {
        var studentId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        await _leaveService.UpdateOwnAsync(id, studentId, dto, cancellationToken);
        return NoContent();
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = $"{nameof(UserRole.Admin)},{nameof(UserRole.Teacher)}")]
    public async Task<IActionResult> UpdateLeaveStatus(Guid id, UpdateLeaveApplicationDto dto, CancellationToken cancellationToken)
    {
        await _leaveService.UpdateStatusAsync(id, dto, cancellationToken);
        return NoContent();
    }
}
