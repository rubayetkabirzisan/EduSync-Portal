using System;

namespace AssignmentSystem.Domain.Entities;

public class ChatMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SenderId { get; set; }
    public User Sender { get; set; } = null!;
    public string Content { get; set; } = string.Empty;
    public string Channel { get; set; } = "General"; // Default to general community chat
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}
