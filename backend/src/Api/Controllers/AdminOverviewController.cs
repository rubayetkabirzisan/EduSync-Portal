using AssignmentSystem.Application.DTOs.Assignments;
using AssignmentSystem.Application.DTOs.Submissions;
using AssignmentSystem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentSystem.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminOverviewController : ControllerBase
{
    private readonly IAssignmentService _assignmentService;
    private readonly ISubmissionService _submissionService;

    public AdminOverviewController(
        IAssignmentService assignmentService,
        ISubmissionService submissionService)
    {
        _assignmentService = assignmentService;
        _submissionService = submissionService;
    }

    [HttpGet("assignments")]
    public async Task<IActionResult> GetAllAssignments([FromQuery] AssignmentListFilter filter)
    {
        var result = await _assignmentService.GetAllAsync(filter);
        return Ok(result);
    }

    [HttpGet("assignments/{id:guid}")]
    public async Task<IActionResult> GetAssignment(Guid id)
    {
        var entity = await _assignmentService.GetByIdAsync(id);
        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpGet("submissions")]
    public async Task<IActionResult> GetAllSubmissions([FromQuery] SubmissionListFilter filter)
    {
        var result = await _submissionService.GetAllAsync(filter);
        return Ok(result);
    }

    [HttpGet("submissions/{id:guid}")]
    public async Task<IActionResult> GetSubmission(Guid id)
    {
        var entity = await _submissionService.GetByIdAsync(id);
        return entity is null ? NotFound() : Ok(entity);
    }
}
