using System;
using System.Threading.Tasks;
using AssignmentSystem.Application.DTOs.Submissions;
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

        var service = new SubmissionService(db);
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

        var service = new SubmissionService(db);
        var request = new GradeSubmissionRequest { Marks = 105, Feedback = "Good" };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => 
            service.GradeAsync(submissionId, teacherId, request));
        Assert.Contains("cannot exceed the maximum", ex.Message);
    }
}
