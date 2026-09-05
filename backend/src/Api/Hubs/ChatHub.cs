using AssignmentSystem.Domain.Entities;
using AssignmentSystem.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using System.Threading.Tasks;
using System;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystem.Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly AppDbContext _context;

    public ChatHub(AppDbContext context)
    {
        _context = context;
    }

    public async Task JoinChannel(string channel)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, channel);
        await Clients.Group(channel).SendAsync("ReceiveSystemMessage", $"{Context.User?.Identity?.Name ?? "A user"} joined the channel.");
    }

    public async Task LeaveChannel(string channel)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, channel);
        await Clients.Group(channel).SendAsync("ReceiveSystemMessage", $"{Context.User?.Identity?.Name ?? "A user"} left the channel.");
    }

    public async Task SendMessage(string channel, string content)
    {
        var userIdString = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
            throw new HubException("Unauthorized.");
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new HubException("User not found.");
        }

        var chatMessage = new ChatMessage
        {
            SenderId = userId,
            Channel = channel,
            Content = content,
            SentAt = DateTime.UtcNow
        };

        _context.ChatMessages.Add(chatMessage);
        await _context.SaveChangesAsync();

        // Broadcast to everyone in the channel
        await Clients.Group(channel).SendAsync("ReceiveMessage", new 
        {
            id = chatMessage.Id,
            senderId = user.Id,
            senderName = user.Name,
            content = chatMessage.Content,
            channel = chatMessage.Channel,
            sentAt = chatMessage.SentAt
        });
    }

    public override async Task OnConnectedAsync()
    {
        // Auto-join General on connect
        await Groups.AddToGroupAsync(Context.ConnectionId, "General");
        await base.OnConnectedAsync();
    }
}
