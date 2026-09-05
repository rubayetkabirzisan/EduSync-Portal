using System.Threading;
using System.Threading.Tasks;

namespace AssignmentSystem.Application.Interfaces;

public interface IChatbotService
{
    Task<string> GetChatbotResponseAsync(string message, CancellationToken cancellationToken = default);
}
