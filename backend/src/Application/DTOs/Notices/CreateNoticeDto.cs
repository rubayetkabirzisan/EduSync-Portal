using AssignmentSystem.Domain.Enums;

namespace AssignmentSystem.Application.DTOs.Notices;

public record CreateNoticeDto
{
    public string Title { get; init; } = string.Empty;
    public string Content { get; init; } = string.Empty;
    public NoticeAudience Audience { get; init; }
}
