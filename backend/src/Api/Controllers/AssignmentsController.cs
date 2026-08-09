using AssignmentSystem.Api.Extensions;
using AssignmentSystem.Application.DTOs.Assignments;
using AssignmentSystem.Application.DTOs.Submissions;
using AssignmentSystem.Application.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentSystem.Api.Controllers;

[ApiController]
[Route("api/assignments")]
[Authorize(Roles = "Teacher")]
public class AssignmentsController : ControllerBase
{
    private readonly IAssignmentService _assignmentService;
    private readonly ISubmissionService _submissionService;
    private readonly ITeachingAssignmentService _teachingAssignmentService;
    private readonly IValidator<CreateAssignmentRequest> _createValidator;
    private readonly IValidator<UpdateAssignmentRequest> _updateValidator;
    private readonly IValidator<GradeSubmissionRequest> _gradeValidator;
    private readonly IValidator<ChangeSubmissionStatusRequest> _statusValidator;

    public AssignmentsController(
        IAssignmentService assignmentService,
        ISubmissionService submissionService,
        ITeachingAssignmentService teachingAssignmentService,
        IValidator<CreateAssignmentRequest> createValidator,
        IValidator<UpdateAssignmentRequest> updateValidator,
        IValidator<GradeSubmissionRequest> gradeValidator,
        IValidator<ChangeSubmissionStatusRequest> statusValidator)
    {
        _assignmentService = assignmentService;
        _submissionService = submissionService;
        _teachingAssignmentService = teachingAssignmentService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _gradeValidator = gradeValidator;
        _statusValidator = statusValidator;
    }

    [HttpGet("my-allotments")]
    public async Task<IActionResult> GetMyAllotments()
    {
        var teacherId = User.GetUserId();
        var result = await _teachingAssignmentService.GetAllAsync(1, 100, teacherId: teacherId);
        return Ok(result.Items);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] AssignmentListFilter filter)
    {
        var teacherId = User.GetUserId();
        var result = await _assignmentService.GetAllAsync(filter, teacherId);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var entity = await _assignmentService.GetByIdAsync(id);
        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateAssignmentRequest request)
    {
        var validation = await _createValidator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(validation.Errors.Select(e => new { field = e.PropertyName, error = e.ErrorMessage }));

        var teacherId = User.GetUserId();
        var entity = await _assignmentService.CreateAsync(teacherId, request);
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, entity);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateAssignmentRequest request)
    {
        var validation = await _updateValidator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(validation.Errors.Select(e => new { field = e.PropertyName, error = e.ErrorMessage }));

        var teacherId = User.GetUserId();
        var entity = await _assignmentService.UpdateAsync(id, teacherId, request);
        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var teacherId = User.GetUserId();
        var deleted = await _assignmentService.DeleteAsync(id, teacherId);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPatch("{id:guid}/publish")]
    public async Task<IActionResult> Publish(Guid id)
    {
        var teacherId = User.GetUserId();
        var entity = await _assignmentService.PublishAsync(id, teacherId);
        return entity is null ? NotFound() : Ok(entity);
    }

    // ── Submission Management (Teacher side) ───────────────────────

    [HttpGet("submissions")]
    public async Task<IActionResult> GetAllSubmissions([FromQuery] SubmissionListFilter filter)
    {
        var teacherId = User.GetUserId();
        var result = await _submissionService.GetTeacherSubmissionsAsync(teacherId, filter);
        return Ok(result);
    }

    [HttpGet("{assignmentId:guid}/submissions")]
    public async Task<IActionResult> GetSubmissions(Guid assignmentId, [FromQuery] SubmissionListFilter filter)
    {
        var teacherId = User.GetUserId();
        var result = await _submissionService.GetAssignmentSubmissionsAsync(assignmentId, teacherId, filter);
        return Ok(result);
    }

    [HttpPost("submissions/{submissionId:guid}/grade")]
    public async Task<IActionResult> Grade(Guid submissionId, GradeSubmissionRequest request)
    {
        var validation = await _gradeValidator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(validation.Errors.Select(e => new { field = e.PropertyName, error = e.ErrorMessage }));

        var teacherId = User.GetUserId();
        var result = await _submissionService.GradeAsync(submissionId, teacherId, request);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPatch("submissions/{submissionId:guid}/status")]
    public async Task<IActionResult> ChangeStatus(Guid submissionId, ChangeSubmissionStatusRequest request)
    {
        var validation = await _statusValidator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(validation.Errors.Select(e => new { field = e.PropertyName, error = e.ErrorMessage }));

        var teacherId = User.GetUserId();
        var result = await _submissionService.ChangeStatusAsync(submissionId, teacherId, request);
        return result is null ? NotFound() : Ok(result);
    }
}
