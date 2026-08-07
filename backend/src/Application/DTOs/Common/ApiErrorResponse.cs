namespace AssignmentSystem.Application.DTOs.Common;

public class ApiErrorResponse
{
    public string Message { get; set; } = string.Empty;
    public string? Detail { get; set; }
    public int StatusCode { get; set; }
    public IEnumerable<FieldError>? Errors { get; set; }
}

public class FieldError
{
    public string Field { get; set; } = string.Empty;
    public string Error { get; set; } = string.Empty;
}
