using AssignmentSystem.Infrastructure.Services;
using Xunit;

namespace AssignmentSystem.Api.UnitTests.Services;

public class ChatbotServiceTests
{
    [Fact]
    public async Task GetChatbotResponseAsync_ForAssignmentSubmission_ReturnsPortalInstructions()
    {
        using var httpClient = new HttpClient(new UnexpectedRequestHandler())
        {
            BaseAddress = new Uri("https://example.test/api/")
        };
        var service = new ChatbotService(httpClient);

        var response = await service.GetChatbotResponseAsync("How do I submit my assignment?");

        Assert.Contains("Student Portal > Assignments", response);
        Assert.Contains("Submit", response);
    }

    [Fact]
    public async Task GetChatbotResponseAsync_ForClassTaskSubmission_ReturnsPortalInstructions()
    {
        using var httpClient = new HttpClient(new UnexpectedRequestHandler())
        {
            BaseAddress = new Uri("https://example.test/api/")
        };
        var service = new ChatbotService(httpClient);

        var response = await service.GetChatbotResponseAsync("How can I submit class tasks?");

        Assert.Contains("Student Portal > Assignments", response);
        Assert.Contains("Submit", response);
    }

    private sealed class UnexpectedRequestHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            throw new InvalidOperationException("Portal help should not call the external chatbot.");
    }
}
