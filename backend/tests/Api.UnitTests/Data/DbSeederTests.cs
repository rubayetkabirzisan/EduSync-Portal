using AssignmentSystem.Application.DTOs.Auth;
using AssignmentSystem.Domain.Enums;
using AssignmentSystem.Infrastructure.Data;
using AssignmentSystem.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace Api.UnitTests.Data;

public class DbSeederTests
{
    [Fact]
    public async Task SeedAsync_CreatesWorkingTeacherAndStudentCredentials()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using var db = new AppDbContext(options);
        await DbSeeder.SeedAsync(db);

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = "unit-test-jwt-secret-that-is-at-least-32-characters",
                ["Jwt:Issuer"] = "assignment-system-api",
                ["Jwt:Audience"] = "assignment-system-client",
                ["Jwt:ExpiryMinutes"] = "120",
            })
            .Build();
        var authService = new AuthService(db, configuration);

        var teacher = await authService.LoginAsync(new LoginRequest
        {
            Email = "teacher1@school.test",
            Password = "Passw0rd!",
        });
        var student = await authService.LoginAsync(new LoginRequest
        {
            Email = "student@school.test",
            Password = "Passw0rd!",
        });

        Assert.NotNull(teacher);
        Assert.Equal(UserRole.Teacher.ToString(), teacher.Role);
        Assert.NotNull(student);
        Assert.Equal(UserRole.Student.ToString(), student.Role);
    }
}
