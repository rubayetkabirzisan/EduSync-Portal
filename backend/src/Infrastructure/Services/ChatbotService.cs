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
}
