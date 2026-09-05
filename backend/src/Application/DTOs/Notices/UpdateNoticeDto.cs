using AssignmentSystem.Domain.Enums;

namespace AssignmentSystem.Application.DTOs.Notices;

public record UpdateNoticeDto
{
    public string? Title { get; init; }
    public string? Content { get; init; }
    public NoticeAudience? Audience { get; init; }
}
