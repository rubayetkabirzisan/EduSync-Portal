using AssignmentSystem.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Resend;

namespace AssignmentSystem.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly IResend _resend;
    private readonly ILogger<NotificationService> _logger;
    private readonly string _fromAddress;

    public NotificationService(IResend resend, ILogger<NotificationService> logger,
        IConfiguration config)
    {
        _resend = resend;
        _logger = logger;
        // Use Resend's free sandbox address, or your own verified domain
        _fromAddress = config["Notifications:FromAddress"] ?? "EduSync Portal <onboarding@resend.dev>";
    }

    public async Task SendGradedNotificationAsync(string studentEmail, string studentName,
        string assignmentTitle, int marks, int maxMarks, string? feedback)
    {
        try
        {
            var feedbackLine = string.IsNullOrEmpty(feedback)
                ? ""
                : $"<p><strong>Teacher Feedback:</strong> {feedback}</p>";

            var message = new EmailMessage
            {
                From = _fromAddress,
                To = { studentEmail },
                Subject = $"Your assignment \"{assignmentTitle}\" has been graded!",
                HtmlBody = $@"
                    <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto;'>
                        <h2 style='color: #4F46E5;'>Hi {studentName},</h2>
                        <p>Your teacher has graded your submission for <strong>{assignmentTitle}</strong>.</p>
                        <div style='background: #F1F5F9; border-radius: 8px; padding: 16px; margin: 16px 0;'>
                            <p style='font-size: 24px; font-weight: bold; color: #0F172A; margin: 0;'>
                                {marks} / {maxMarks} points
                            </p>
                        </div>
                        {feedbackLine}
                        <p>Log in to <strong>EduSync Portal</strong> to view the full details.</p>
                        <hr style='border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;' />
                        <p style='color: #94A3B8; font-size: 12px;'>
                            This is an automated notification from EduSync Portal.
                        </p>
                    </div>"
            };

            await _resend.EmailSendAsync(message);
            _logger.LogInformation("Graded notification sent to {Email} for assignment '{Title}'",
                studentEmail, assignmentTitle);
        }
        catch (Exception ex)
        {
            // Log but don't throw — email failure should never break grading
            _logger.LogWarning(ex, "Failed to send graded notification to {Email}", studentEmail);
        }
    }

    public async Task SendAssignmentPublishedNotificationAsync(
        List<(string Email, string Name)> students,
        string assignmentTitle, string className, DateTime deadline)
    {
        try
        {
            foreach (var (email, name) in students)
            {
                var message = new EmailMessage
                {
                    From = _fromAddress,
                    To = { email },
                    Subject = $"New assignment published: \"{assignmentTitle}\"",
                    HtmlBody = $@"
                        <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto;'>
                            <h2 style='color: #059669;'>Hi {name},</h2>
                            <p>A new assignment has been published for your class <strong>{className}</strong>.</p>
                            <div style='background: #F1F5F9; border-radius: 8px; padding: 16px; margin: 16px 0;'>
                                <p style='font-weight: bold; color: #0F172A; margin: 0 0 8px 0;'>
                                    {assignmentTitle}
                                </p>
                                <p style='color: #64748B; margin: 0;'>
                                    Deadline: {deadline:MMMM dd, yyyy 'at' hh:mm tt} UTC
                                </p>
                            </div>
                            <p>Log in to <strong>EduSync Portal</strong> to view the assignment and submit your work.</p>
                            <hr style='border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;' />
                            <p style='color: #94A3B8; font-size: 12px;'>
                                This is an automated notification from EduSync Portal.
                            </p>
                        </div>"
                };

                await _resend.EmailSendAsync(message);
            }

            _logger.LogInformation("Published notification sent to {Count} students for '{Title}'",
                students.Count, assignmentTitle);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send published notifications for '{Title}'", assignmentTitle);
        }
    }
}
