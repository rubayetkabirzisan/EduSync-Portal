using AssignmentSystem.Domain.Entities;
using AssignmentSystem.Domain.Enums;
using AssignmentSystem.Infrastructure.Data;
using AssignmentSystem.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace AssignmentSystem.Api.UnitTests.Services;

public class AiAdvisorServiceTests
{
    [Fact]
    public async Task GetRecommendationsAsync_WhenAllSubjectsAreCurrent_ReturnsCurrentSubjectPlan()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var context = new AppDbContext(options);

        var studentId = Guid.NewGuid();
        var classId = Guid.NewGuid();
        var subjectId = Guid.NewGuid();

        context.Users.Add(new User
        {
            Id = studentId,
            Name = "Student",
            Email = "student@example.test",
            Role = UserRole.Student,
            ClassId = classId
        });
        context.Subjects.Add(new Subject { Id = subjectId, Name = "Science", Code = "SCI-10" });
        context.TeachingAssignments.Add(new TeachingAssignment
        {
            Id = Guid.NewGuid(),
            TeacherId = Guid.NewGuid(),
            ClassId = classId,
            SubjectId = subjectId
        });
        await context.SaveChangesAsync();

        var recommendations = (await new AiAdvisorService(context)
            .GetRecommendationsAsync(studentId)).ToList();

        var recommendation = Assert.Single(recommendations);
        Assert.Equal(subjectId, recommendation.SubjectId);
        Assert.Contains("current class plan", recommendation.Reason);
    }
}
