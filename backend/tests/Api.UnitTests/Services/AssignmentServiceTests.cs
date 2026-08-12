using System;
using System.Threading.Tasks;
using AssignmentSystem.Application.DTOs.Assignments;
using AssignmentSystem.Application.Interfaces;
using AssignmentSystem.Domain.Entities;
using AssignmentSystem.Domain.Enums;
using AssignmentSystem.Infrastructure.Data;
using AssignmentSystem.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Api.UnitTests.Services;

public class AssignmentServiceTests
{
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task CreateAsync_WhenTeacherNotAssigned_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var db = GetInMemoryDbContext();
        var service = new AssignmentService(db, new NoOpNotificationService());

        var request = new CreateAssignmentRequest
        {
            Title = "Test",
            ClassId = Guid.NewGuid(),
            SubjectId = Guid.NewGuid(),
            Deadline = DateTime.UtcNow.AddDays(1)
        };

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => 
            service.CreateAsync(Guid.NewGuid(), request));
    }

    [Fact]
    public async Task PublishAsync_WhenTeacherIsOwner_UpdatesStatus()
    {
        // Arrange
        var db = GetInMemoryDbContext();
        var teacherId = Guid.NewGuid();
        
        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Test Draft",
            TeacherId = teacherId,
            Status = AssignmentStatus.Draft,
            Class = new Class { Id = Guid.NewGuid(), Name = "10", Section = "A" },
            Subject = new Subject { Id = Guid.NewGuid(), Name = "Math", Code = "M1" },
            Teacher = new User { Id = teacherId, Name = "Teacher" }
        };
        
        db.Assignments.Add(assignment);
        await db.SaveChangesAsync();

        var service = new AssignmentService(db, new NoOpNotificationService());

        // Act
        var result = await service.PublishAsync(assignment.Id, teacherId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Published", result.Status);
    }

    private class NoOpNotificationService : INotificationService
    {
        public Task SendGradedNotificationAsync(string studentEmail, string studentName,
            string assignmentTitle, int marks, int maxMarks, string? feedback) => Task.CompletedTask;

        public Task SendAssignmentPublishedNotificationAsync(System.Collections.Generic.List<(string Email, string Name)> students,
            string assignmentTitle, string className, DateTime deadline) => Task.CompletedTask;
    }
}
