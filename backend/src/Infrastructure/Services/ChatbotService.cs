using AssignmentSystem.Application.Interfaces;
using System.Net.Http;
using System.Text.Json;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace AssignmentSystem.Infrastructure.Services;

public class ChatbotService : IChatbotService
{
    private readonly HttpClient _httpClient;

    public ChatbotService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<string> GetChatbotResponseAsync(string message, CancellationToken cancellationToken = default)
    {
        var portalHelpResponse = GetPortalHelpResponse(message);
        if (portalHelpResponse is not null)
        {
            return portalHelpResponse;
        }

        var requestPayload = new { message = message };
        var jsonContent = new StringContent(JsonSerializer.Serialize(requestPayload), Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync("getResponse/", jsonContent, cancellationToken);
        response.EnsureSuccessStatusCode();

        var responseStream = await response.Content.ReadAsStreamAsync(cancellationToken);
        
        using var jsonDoc = await JsonDocument.ParseAsync(responseStream, cancellationToken: cancellationToken);
        if (jsonDoc.RootElement.TryGetProperty("message", out JsonElement messageElement))
        {
            return messageElement.GetString() ?? string.Empty;
        }

        return "I'm sorry, I could not understand the response from my core engine.";
    }

    private static string? GetPortalHelpResponse(string message)
    {
        var normalized = message.Trim().ToLowerInvariant();

        if (HasAny(normalized, "assignment", "homework", "coursework", "class task", "task") &&
            HasAny(normalized, "submit", "upload", "send", "turn in", "hand in"))
        {
            return "To submit an assignment, open Student Portal > Assignments, select a published assignment, enter your answer, and choose Submit. You can update it before the deadline when resubmission is allowed.";
        }

        if (HasAny(normalized, "assignment", "homework", "coursework", "class task", "task"))
        {
            return "Open Student Portal > Assignments to view published work for your class, deadlines, submission status, marks, and teacher feedback.";
        }

        if (HasAny(normalized, "leave", "absence", "absent") &&
            HasAny(normalized, "apply", "request", "submit"))
        {
            return "Open Student Portal > Leave Applications, select Apply for Leave, enter the dates and reason, then submit. You can track the approval status on the same page.";
        }

        if (HasAny(normalized, "scholarship", "financial aid"))
        {
            return "Open Student Portal > Scholarships to view available programs and apply. Your application status will move through Pending, Under Review, Approved or Rejected, and Disbursed when payment has been issued.";
        }

        if (HasAny(normalized, "exam", "test", "schedule"))
        {
            return "Open Student Portal > Exams to see your class's upcoming exams, including the subject, start time, duration, maximum marks, and room.";
        }

        if (HasAny(normalized, "attendance", "present", "late", "excused"))
        {
            return "Open Student Portal > Attendance to review attendance recorded by your teachers. Records can be Present, Late, Excused, or Absent.";
        }

        if (HasAny(normalized, "notice", "announcement"))
        {
            return "Open Student Portal > Notices to read announcements published for students or for everyone in the university.";
        }

        if (HasAny(normalized, "recommend", "advisor", "study next", "course plan"))
        {
            return "Open Student Portal > AI Advisor and choose Generate My Plan to request subject recommendations based on the academic data available in EduSync.";
        }

        return null;
    }

    private static bool HasAny(string message, params string[] terms) =>
        terms.Any(message.Contains);
}
