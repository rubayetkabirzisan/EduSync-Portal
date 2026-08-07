using AssignmentSystem.Api.Extensions;
using AssignmentSystem.Application.DTOs.Assignments;
using AssignmentSystem.Application.DTOs.Submissions;
using AssignmentSystem.Application.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentSystem.Api.Controllers;

[ApiController]
[Route("api/student")]
[Authorize(Roles = "Student")]
public class StudentController : ControllerBase
{
    private readonly IAssignmentService _assignmentService;
    private readonly ISubmissionService _submissionService;
    private readonly IValidator<CreateSubmissionRequest> _createValidator;
    private readonly IValidator<UpdateSubmissionRequest> _updateValidator;

    public StudentController(
        IAssignmentService assignmentService,
        ISubmissionService submissionService,
        IValidator<CreateSubmissionRequest> createValidator,
        IValidator<UpdateSubmissionRequest> updateValidator)
    {
        _assignmentService = assignmentService;
        _submissionService = submissionService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    // ── Assignments (published, for my class) ──────────────────────

    [HttpGet("assignments")]
    public async Task<IActionResult> GetAssignments([FromQuery] AssignmentListFilter filter)
    {
        var studentId = User.GetUserId();
        var result = await _assignmentService.GetStudentAssignmentsAsync(studentId, filter);
        return Ok(result);
    }

    [HttpGet("assignments/{id:guid}")]
    public async Task<IActionResult> GetAssignment(Guid id)
    {
        var entity = await _assignmentService.GetByIdAsync(id);
        return entity is null ? NotFound() : Ok(entity);
    }

    // ── Submissions ────────────────────────────────────────────────

    [HttpGet("submissions")]
    public async Task<IActionResult> GetMySubmissions([FromQuery] SubmissionListFilter filter)
    {
        var studentId = User.GetUserId();
        var result = await _submissionService.GetStudentSubmissionsAsync(studentId, filter);
        return Ok(result);
    }

    [HttpGet("submissions/{id:guid}")]
    public async Task<IActionResult> GetSubmission(Guid id)
    {
        var entity = await _submissionService.GetByIdAsync(id);
        if (entity is null) return NotFound();

        // Students can only view their own submissions
        var studentId = User.GetUserId();
        if (entity.StudentId != studentId)
            return Forbid();

        return Ok(entity);
    }

    [HttpPost("submissions")]
    public async Task<IActionResult> Submit(CreateSubmissionRequest request)
    {
        var validation = await _createValidator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(validation.Errors.Select(e => new { field = e.PropertyName, error = e.ErrorMessage }));

        var studentId = User.GetUserId();
        var result = await _submissionService.CreateAsync(studentId, request);
        return CreatedAtAction(nameof(GetSubmission), new { id = result.Id }, result);
    }

    [HttpPut("submissions/{id:guid}")]
    public async Task<IActionResult> UpdateSubmission(Guid id, UpdateSubmissionRequest request)
    {
        var validation = await _updateValidator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(validation.Errors.Select(e => new { field = e.PropertyName, error = e.ErrorMessage }));

        var studentId = User.GetUserId();
        var result = await _submissionService.UpdateAsync(id, studentId, request);
        return result is null ? NotFound() : Ok(result);
    }
}
