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
[Authorize(Roles = "Student")]
public class AiAdvisorController : ControllerBase
{
    private readonly IAiAdvisorService _advisorService;

    public AiAdvisorController(IAiAdvisorService advisorService)
    {
        _advisorService = advisorService;
    }

    [HttpGet("recommendations")]
    public async Task<IActionResult> GetRecommendations(CancellationToken cancellationToken)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdString, out Guid studentId))
            return Unauthorized();

        var recommendations = await _advisorService.GetRecommendationsAsync(studentId, cancellationToken);
        return Ok(recommendations);
    }
}
