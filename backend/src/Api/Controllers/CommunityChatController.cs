using AssignmentSystem.Api.Extensions;
using AssignmentSystem.Api.Hubs;
using AssignmentSystem.Domain.Entities;
using AssignmentSystem.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CommunityChatController : ControllerBase
{
    private const string GeneralChannel = "General";
    private readonly AppDbContext _db;
    private readonly IHubContext<ChatHub> _hubContext;

    public CommunityChatController(AppDbContext db, IHubContext<ChatHub> hubContext)
    {
        _db = db;
        _hubContext = hubContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetMessages(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.ChatMessages
            .AsNoTracking()
            .Include(message => message.Sender)
            .Where(message => message.Channel == GeneralChannel);
        var totalCount = await query.CountAsync(cancellationToken);
        var entities = await query
            .OrderByDescending(message => message.SentAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        var items = entities.Select(ToResponse).ToList();

        return Ok(new
        {
            items,
            page,
            pageSize,
            totalCount,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        });
    }

    [HttpPost("send")]
    public async Task<IActionResult> SendMessage(
        SendCommunityMessageRequest request,
        CancellationToken cancellationToken)
    {
        var content = request.Content?.Trim();
        if (string.IsNullOrWhiteSpace(content))
            return BadRequest(new { message = "Message content is required." });
        if (content.Length > 2000)
            return BadRequest(new { message = "Messages cannot exceed 2000 characters." });

        var user = await _db.Users.FindAsync(new object[] { User.GetUserId() }, cancellationToken);
        if (user is null)
            return Unauthorized();

        var entity = new ChatMessage
        {
            SenderId = user.Id,
            Sender = user,
            Channel = GeneralChannel,
            Content = content,
            SentAt = DateTime.UtcNow
        };
        _db.ChatMessages.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);

        var response = ToResponse(entity);
        await _hubContext.Clients.Group(GeneralChannel)
            .SendAsync("ReceiveMessage", response, cancellationToken);

        return Ok(response);
    }

    private static object ToResponse(ChatMessage message) => new
    {
        message.Id,
        message.SenderId,
        SenderName = message.Sender.Name,
        SenderRole = message.Sender.Role.ToString(),
        message.Content,
        Timestamp = message.SentAt
    };
}

public record SendCommunityMessageRequest(string? Content);
