using AssignmentSystem.Application.DTOs.Subjects;
using AssignmentSystem.Application.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentSystem.Api.Controllers;

[ApiController]
[Route("api/admin/subjects")]
[Authorize(Roles = "Admin")]
public class AdminSubjectsController : ControllerBase
{
    private readonly ISubjectService _subjectService;
    private readonly IValidator<CreateSubjectRequest> _createValidator;
    private readonly IValidator<UpdateSubjectRequest> _updateValidator;

    public AdminSubjectsController(
        ISubjectService subjectService,
        IValidator<CreateSubjectRequest> createValidator,
        IValidator<UpdateSubjectRequest> updateValidator)
    {
        _subjectService = subjectService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null)
    {
        var result = await _subjectService.GetAllAsync(page, pageSize, search);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var entity = await _subjectService.GetByIdAsync(id);
        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateSubjectRequest request)
    {
        var validation = await _createValidator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(validation.Errors.Select(e => new { field = e.PropertyName, error = e.ErrorMessage }));

        var entity = await _subjectService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, entity);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateSubjectRequest request)
    {
        var validation = await _updateValidator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(validation.Errors.Select(e => new { field = e.PropertyName, error = e.ErrorMessage }));

        var entity = await _subjectService.UpdateAsync(id, request);
        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _subjectService.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
