using System;
using System.Threading.Tasks;
using AssignmentSystem.Application.DTOs.Submissions;
using AssignmentSystem.Application.Interfaces;
using AssignmentSystem.Domain.Entities;
using AssignmentSystem.Domain.Enums;
using AssignmentSystem.Infrastructure.Data;
using AssignmentSystem.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Api.UnitTests.Services;

public class SubmissionServiceTests
{
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task CreateAsync_WhenAssignmentNotPublished_ThrowsInvalidOperationException()
    {
        // Arrange
        var db = GetInMemoryDbContext();
        var studentId = Guid.NewGuid();
        var assignmentId = Guid.NewGuid();
        var classId = Guid.NewGuid();

        db.Users.Add(new User { Id = studentId, Role = UserRole.Student, ClassId = classId });
        db.Assignments.Add(new Assignment { Id = assignmentId, ClassId = classId, Status = AssignmentStatus.Draft });
        await db.SaveChangesAsync();

        var service = new SubmissionService(db, new NoOpNotificationService());
        var request = new CreateSubmissionRequest { AssignmentId = assignmentId, Content = "Test" };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => 
            service.CreateAsync(studentId, request));
        Assert.Equal("This assignment is not published yet.", ex.Message);
    }

    [Fact]
    public async Task GradeAsync_WhenMarksExceedMax_ThrowsInvalidOperationException()
    {
        // Arrange
        var db = GetInMemoryDbContext();
        var teacherId = Guid.NewGuid();
        var submissionId = Guid.NewGuid();

        var assignment = new Assignment 
        { 
            Id = Guid.NewGuid(), 
            TeacherId = teacherId, 
            MaxMarks = 100 
        };
        db.Submissions.Add(new Submission 
        { 
            Id = submissionId, 
            Assignment = assignment 
        });
        await db.SaveChangesAsync();

        var service = new SubmissionService(db, new NoOpNotificationService());
        var request = new GradeSubmissionRequest { Marks = 105, Feedback = "Good" };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => 
            service.GradeAsync(submissionId, teacherId, request));
        Assert.Contains("cannot exceed the maximum", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_WhenStudentNotInClass_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var db = GetInMemoryDbContext();
        var studentId = Guid.NewGuid();
        var assignmentId = Guid.NewGuid();

        db.Users.Add(new User { Id = studentId, Role = UserRole.Student, ClassId = Guid.NewGuid() });
        db.Assignments.Add(new Assignment
        {
            Id = assignmentId,
            ClassId = Guid.NewGuid(), // Different class than student
            Status = AssignmentStatus.Published
        });
        await db.SaveChangesAsync();

        var service = new SubmissionService(db, new NoOpNotificationService());
        var request = new CreateSubmissionRequest { AssignmentId = assignmentId, Content = "Test" };

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.CreateAsync(studentId, request));
    }

    [Fact]
    public async Task UpdateAsync_WhenAlreadyGraded_ThrowsInvalidOperationException()
    {
        // Arrange
        var db = GetInMemoryDbContext();
        var studentId = Guid.NewGuid();
        var submissionId = Guid.NewGuid();

        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            AllowResubmission = true,
            Deadline = DateTime.UtcNow.AddDays(5)
        };
        db.Submissions.Add(new Submission
        {
            Id = submissionId,
            StudentId = studentId,
            Assignment = assignment,
            Status = SubmissionStatus.Graded
        });
        await db.SaveChangesAsync();

        var service = new SubmissionService(db, new NoOpNotificationService());
        var request = new UpdateSubmissionRequest { Content = "Updated answer" };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpdateAsync(submissionId, studentId, request));
        Assert.Contains("already been graded", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_WhenDeadlinePassed_ThrowsInvalidOperationException()
    {
        // Arrange
        var db = GetInMemoryDbContext();
        var studentId = Guid.NewGuid();
        var submissionId = Guid.NewGuid();

        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            AllowResubmission = true,
            Deadline = DateTime.UtcNow.AddDays(-1) // Deadline already passed
        };
        db.Submissions.Add(new Submission
        {
            Id = submissionId,
            StudentId = studentId,
            Assignment = assignment,
            Status = SubmissionStatus.Submitted
        });
        await db.SaveChangesAsync();

        var service = new SubmissionService(db, new NoOpNotificationService());
        var request = new UpdateSubmissionRequest { Content = "Too late answer" };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpdateAsync(submissionId, studentId, request));
        Assert.Contains("deadline has passed", ex.Message);
    }

    [Fact]
    public async Task ChangeStatusAsync_WhenStatusIsGraded_ThrowsInvalidOperationException()
    {
        // Arrange — verifies the Enum.Parse bypass security fix
        var db = GetInMemoryDbContext();
        var teacherId = Guid.NewGuid();
        var submissionId = Guid.NewGuid();

        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            TeacherId = teacherId,
            MaxMarks = 100
        };
        db.Submissions.Add(new Submission
        {
            Id = submissionId,
            Assignment = assignment,
            Status = SubmissionStatus.Submitted
        });
        await db.SaveChangesAsync();

        var service = new SubmissionService(db, new NoOpNotificationService());
        var request = new ChangeSubmissionStatusRequest { Status = "Graded" };

        // Act & Assert — "Graded" is not allowed via ChangeStatus; must use Grade endpoint
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.ChangeStatusAsync(submissionId, teacherId, request));
        Assert.Contains("UnderReview", ex.Message);
    }

    private class NoOpNotificationService : INotificationService
    {
        public Task SendGradedNotificationAsync(string studentEmail, string studentName,
            string assignmentTitle, int marks, int maxMarks, string? feedback) => Task.CompletedTask;

        public Task SendAssignmentPublishedNotificationAsync(System.Collections.Generic.List<(string Email, string Name)> students,
            string assignmentTitle, string className, DateTime deadline) => Task.CompletedTask;
    }
}
