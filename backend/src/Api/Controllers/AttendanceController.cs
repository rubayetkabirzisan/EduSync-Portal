using AssignmentSystem.Application.DTOs.Attendance;
using AssignmentSystem.Application.Interfaces;
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
            await _attendanceService.MarkAttendanceAsync(dto, cancellationToken);
            return Ok(new { message = "Attendance marked successfully." });
        }
        catch (System.Collections.Generic.KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
