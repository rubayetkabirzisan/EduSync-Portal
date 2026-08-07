using AssignmentSystem.Application.DTOs.TeachingAssignments;
using AssignmentSystem.Application.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentSystem.Api.Controllers;

[ApiController]
[Route("api/admin/teaching-assignments")]
[Authorize(Roles = "Admin")]
public class AdminTeachingAssignmentsController : ControllerBase
{
    private readonly ITeachingAssignmentService _service;
    private readonly IValidator<CreateTeachingAssignmentRequest> _validator;

    public AdminTeachingAssignmentsController(
        ITeachingAssignmentService service,
        IValidator<CreateTeachingAssignmentRequest> validator)
    {
        _service = service;
        _validator = validator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] Guid? teacherId = null,
        [FromQuery] Guid? classId = null)
    {
        var result = await _service.GetAllAsync(page, pageSize, teacherId, classId);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateTeachingAssignmentRequest request)
    {
        var validation = await _validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(validation.Errors.Select(e => new { field = e.PropertyName, error = e.ErrorMessage }));

        var result = await _service.CreateAsync(request);
        return Created($"/api/admin/teaching-assignments/{result.Id}", result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _service.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
