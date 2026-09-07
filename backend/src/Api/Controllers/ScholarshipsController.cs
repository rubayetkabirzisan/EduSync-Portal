using AssignmentSystem.Application.DTOs.Scholarships;
using AssignmentSystem.Application.Interfaces;
using AssignmentSystem.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AssignmentSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ScholarshipsController : ControllerBase
{
    private readonly IScholarshipService _scholarshipService;

    public ScholarshipsController(IScholarshipService scholarshipService)
    {
        _scholarshipService = scholarshipService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllScholarships(CancellationToken cancellationToken)
    {
        var scholarships = await _scholarshipService.GetAllAsync(cancellationToken);
        return Ok(scholarships);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetScholarship(Guid id, CancellationToken cancellationToken)
    {
        var scholarship = await _scholarshipService.GetByIdAsync(id, cancellationToken);
        return Ok(scholarship);
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> CreateScholarship(CreateScholarshipDto dto, CancellationToken cancellationToken)
    {
        var scholarship = await _scholarshipService.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetScholarship), new { id = scholarship.Id }, scholarship);
    }

    [HttpPost("apply")]
    [Authorize(Roles = nameof(UserRole.Student))]
    public async Task<IActionResult> Apply(ApplyScholarshipDto dto, CancellationToken cancellationToken)
    {
        var studentId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var application = await _scholarshipService.ApplyAsync(dto, studentId, cancellationToken);
        return Ok(application);
    }

    [HttpGet("my-applications")]
    [Authorize(Roles = nameof(UserRole.Student))]
    public async Task<IActionResult> GetMyApplications(CancellationToken cancellationToken)
    {
        var studentId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var applications = await _scholarshipService.GetMyApplicationsAsync(studentId, cancellationToken);
        return Ok(applications);
    }

    [HttpGet("applications")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> GetAllApplications(CancellationToken cancellationToken)
    {
        var applications = await _scholarshipService.GetAllApplicationsAsync(cancellationToken);
        return Ok(applications);
    }

    [HttpGet("{scholarshipId}/applications")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> GetApplicationsForScholarship(Guid scholarshipId, CancellationToken cancellationToken)
    {
        var applications = await _scholarshipService.GetApplicationsForScholarshipAsync(scholarshipId, cancellationToken);
        return Ok(applications);
    }

    [HttpPut("applications/{applicationId}/status")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> UpdateApplicationStatus(Guid applicationId, UpdateScholarshipApplicationDto dto, CancellationToken cancellationToken)
    {
        await _scholarshipService.UpdateApplicationStatusAsync(applicationId, dto, cancellationToken);
        return NoContent();
    }
}
