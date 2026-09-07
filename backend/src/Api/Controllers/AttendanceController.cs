using AssignmentSystem.Application.DTOs.Attendance;
using AssignmentSystem.Application.Interfaces;
using AssignmentSystem.Api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace AssignmentSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceService _attendanceService;

    public AttendanceController(IAttendanceService attendanceService)
    {
        _attendanceService = attendanceService;
    }

    [HttpGet("student/{studentId:guid}")]
    [Authorize(Roles = "Admin,Teacher,Student")]
    public async Task<IActionResult> GetByStudent(Guid studentId, CancellationToken cancellationToken)
    {
        // If user is a student, ensure they are requesting their own attendance
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (role == "Student" && userId != studentId.ToString())
        {
            return Forbid();
        }

        var attendances = await _attendanceService.GetByStudentAsync(studentId, cancellationToken);
        return Ok(attendances);
    }

    [HttpGet("me")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMine(CancellationToken cancellationToken)
    {
        var attendances = await _attendanceService.GetByStudentAsync(User.GetUserId(), cancellationToken);
        return Ok(attendances);
    }

    [HttpGet("roster")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> GetRoster(
        [FromQuery] Guid classId,
        [FromQuery] Guid subjectId,
        [FromQuery] DateTime date,
        CancellationToken cancellationToken)
    {
        try
        {
            var isAdmin = User.GetUserRole() == "Admin";
            var students = await _attendanceService.GetRosterAsync(
                classId,
                subjectId,
                date,
                User.GetUserId(),
                isAdmin,
                cancellationToken);
            return Ok(students);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (System.Collections.Generic.KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("subject/{subjectId:guid}")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> GetBySubject(Guid subjectId, [FromQuery] DateTime date, CancellationToken cancellationToken)
    {
        var attendances = await _attendanceService.GetBySubjectAsync(subjectId, date, cancellationToken);
        return Ok(attendances);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> MarkAttendance([FromBody] CreateAttendanceDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var isAdmin = User.GetUserRole() == "Admin";
            await _attendanceService.MarkAttendanceAsync(
                dto,
                User.GetUserId(),
                isAdmin,
                cancellationToken);
            return Ok(new { message = "Attendance marked successfully." });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (System.Collections.Generic.KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
