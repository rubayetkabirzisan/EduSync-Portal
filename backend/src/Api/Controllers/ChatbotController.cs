using AssignmentSystem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading;
using System.Threading.Tasks;

namespace AssignmentSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatbotController : ControllerBase
{
    private readonly IChatbotService _chatbotService;

    public ChatbotController(IChatbotService chatbotService)
    {
        _chatbotService = chatbotService;
    }

    public class ChatRequest
    {
        public string Message { get; set; } = string.Empty;
    }

    [HttpPost("chat")]
    public async Task<IActionResult> Chat([FromBody] ChatRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { error = "Message cannot be empty." });
        }

        try
        {
            var reply = await _chatbotService.GetChatbotResponseAsync(request.Message, cancellationToken);
            return Ok(new { reply = reply });
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { error = "An error occurred while communicating with the chatbot service.", details = ex.Message });
        }
    }
}
