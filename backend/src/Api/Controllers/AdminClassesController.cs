using AssignmentSystem.Application.DTOs.Classes;
using AssignmentSystem.Application.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentSystem.Api.Controllers;

[ApiController]
[Route("api/admin/classes")]
[Authorize(Roles = "Admin")]
public class AdminClassesController : ControllerBase
{
    private readonly IClassService _classService;
    private readonly IValidator<CreateClassRequest> _createValidator;
    private readonly IValidator<UpdateClassRequest> _updateValidator;

    public AdminClassesController(
        IClassService classService,
        IValidator<CreateClassRequest> createValidator,
        IValidator<UpdateClassRequest> updateValidator)
    {
        _classService = classService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null)
    {
        var result = await _classService.GetAllAsync(page, pageSize, search);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var entity = await _classService.GetByIdAsync(id);
        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateClassRequest request)
    {
        var validation = await _createValidator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(validation.Errors.Select(e => new { field = e.PropertyName, error = e.ErrorMessage }));

        var entity = await _classService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, entity);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateClassRequest request)
    {
        var validation = await _updateValidator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(validation.Errors.Select(e => new { field = e.PropertyName, error = e.ErrorMessage }));

        var entity = await _classService.UpdateAsync(id, request);
        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _classService.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
