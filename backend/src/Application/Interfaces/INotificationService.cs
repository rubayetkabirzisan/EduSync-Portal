namespace AssignmentSystem.Application.Interfaces;

public interface INotificationService
{
    Task SendGradedNotificationAsync(string studentEmail, string studentName,
        string assignmentTitle, int marks, int maxMarks, string? feedback);

    Task SendAssignmentPublishedNotificationAsync(List<(string Email, string Name)> students,
        string assignmentTitle, string className, DateTime deadline);
}
