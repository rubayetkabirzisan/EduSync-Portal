using AssignmentSystem.Application.DTOs.Auth;

namespace AssignmentSystem.Application.Interfaces;

public interface IAuthService
{
    // Returns null when the email/password combination is invalid — the
    // controller turns that into a 401 without revealing which part was wrong.
    Task<LoginResponse?> LoginAsync(LoginRequest request);
}
