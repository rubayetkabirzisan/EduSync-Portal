using AssignmentSystem.Domain.Entities;
using AssignmentSystem.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystem.Infrastructure.Data;

// Runs once on startup (see Program.cs) if the Users table is empty. Demo
// credentials are documented in the README — every demo account shares one
// password so graders don't have to dig through this file to log in.
public static class DbSeeder
{
    private const string DemoPassword = "Passw0rd!";

    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Users.AnyAsync()) return;

        var hasher = new PasswordHasher<User>();
        string Hash(User u) => hasher.HashPassword(u, DemoPassword);

        var admin = new User { Name = "Ayesha Rahman", Email = "admin@school.test", Role = UserRole.Admin };
        admin.PasswordHash = Hash(admin);

        var teacher1 = new User { Name = "Kamal Hossain", Email = "teacher1@school.test", Role = UserRole.Teacher };
        teacher1.PasswordHash = Hash(teacher1);

        var teacher2 = new User { Name = "Nusrat Jahan", Email = "teacher2@school.test", Role = UserRole.Teacher };
        teacher2.PasswordHash = Hash(teacher2);

        var classA = new Class { Name = "Grade 10", Section = "A" };
        var classB = new Class { Name = "Grade 10", Section = "B" };

        var math = new Subject { Name = "Mathematics", Code = "MATH101" };
        var english = new Subject { Name = "English", Code = "ENG101" };
        var science = new Subject { Name = "Science", Code = "SCI101" };

        var students = new List<User>();
        for (var i = 1; i <= 4; i++)
        {
            var s = new User
            {
                Name = $"Student {i}",
                Email = $"student{i}@school.test",
                Role = UserRole.Student,
                Class = i <= 2 ? classA : classB
            };
            s.PasswordHash = Hash(s);
            students.Add(s);
        }
        // The primary demo account graders will actually log in as.
        students[0].Name = "Rafiul Islam";
        students[0].Email = "student@school.test";

        db.Users.AddRange(admin, teacher1, teacher2);
        db.Users.AddRange(students);
        db.Classes.AddRange(classA, classB);
        db.Subjects.AddRange(math, english, science);

        db.TeachingAssignments.AddRange(
            new TeachingAssignment { Teacher = teacher1, Class = classA, Subject = math },
            new TeachingAssignment { Teacher = teacher1, Class = classB, Subject = math },
            new TeachingAssignment { Teacher = teacher2, Class = classA, Subject = english },
            new TeachingAssignment { Teacher = teacher2, Class = classA, Subject = science }
        );

        var published = new Assignment
        {
            Title = "Algebra Basics — Problem Set 1",
            Description = "Solve the attached ten problems covering linear equations and show your working.",
            Class = classA,
            Subject = math,
            Teacher = teacher1,
            MaxMarks = 100,
            Deadline = DateTime.UtcNow.AddDays(5),
            Status = AssignmentStatus.Published
        };

        var pastDeadline = new Assignment
        {
            Title = "Essay: A Book That Changed My Perspective",
            Description = "Write a 500-word essay. Late submissions are not accepted for this one.",
            Class = classA,
            Subject = english,
            Teacher = teacher2,
            MaxMarks = 50,
            Deadline = DateTime.UtcNow.AddDays(-2),
            Status = AssignmentStatus.Published,
            AllowResubmission = false
        };

        var draft = new Assignment
        {
            Title = "Lab Report Template (Draft)",
            Description = "Not yet published — used to confirm drafts stay hidden from students.",
            Class = classA,
            Subject = science,
            Teacher = teacher2,
            MaxMarks = 30,
            Deadline = DateTime.UtcNow.AddDays(10),
            Status = AssignmentStatus.Draft
        };

        db.Assignments.AddRange(published, pastDeadline, draft);

        db.Submissions.AddRange(
            new Submission
            {
                Assignment = pastDeadline,
                Student = students[0],
                Content = "Attached is my essay on 'The Alchemist' and how it changed how I think about persistence.",
                Status = SubmissionStatus.Graded,
                Marks = 42,
                Feedback = "Strong argument, watch your paragraph transitions.",
                GradedAt = DateTime.UtcNow.AddDays(-1),
                GradedByTeacherId = teacher2.Id
            },
            new Submission
            {
                Assignment = published,
                Student = students[0],
                Content = "Answers to problems 1-10 attached.",
                Status = SubmissionStatus.Submitted
            }
        );

        await db.SaveChangesAsync();
    }
}
