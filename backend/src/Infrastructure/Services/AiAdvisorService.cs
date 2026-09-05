using AssignmentSystem.Application.Interfaces;
using AssignmentSystem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace AssignmentSystem.Infrastructure.Services;

public class AiAdvisorService : IAiAdvisorService
{
    private readonly AppDbContext _context;

    public AiAdvisorService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<RecommendedSubjectDto>> GetRecommendationsAsync(Guid studentId, CancellationToken cancellationToken = default)
    {
        // Get subjects the student is already taking (based on their class)
        var student = await _context.Users.FindAsync(new object[] { studentId }, cancellationToken);
        
        var enrolledSubjectIds = new List<Guid>();
        if (student?.ClassId != null)
        {
            enrolledSubjectIds = await _context.TeachingAssignments
                .Where(ta => ta.ClassId == student.ClassId)
                .Select(ta => ta.SubjectId)
                .Distinct()
                .ToListAsync(cancellationToken);
        }

        // Get all available subjects not yet enrolled
        var availableSubjects = await _context.Subjects
            .Where(s => !enrolledSubjectIds.Contains(s.Id))
            .ToListAsync(cancellationToken);

        // MOCK AI LOGIC: In a real app, this would use ML/GPT based on past grades (GPA).
        // For this implementation, we simulate an AI analysis by recommending advanced courses
        // if they have completed basics, or just picking suitable next steps.
        
        var recommendations = new List<RecommendedSubjectDto>();
        var random = new Random();
        double mockGpa = 3.0 + (random.NextDouble() * 1.0); // Simulate GPA between 3.0 and 4.0

        foreach (var subject in availableSubjects.Take(3)) // Recommend top 3
        {
            string reason = mockGpa >= 3.5 
                ? $"With your stellar simulated GPA of {mockGpa:F2}, you are ready for advanced topics in {subject.Name}." 
                : $"Based on your academic profile, {subject.Name} aligns well with your next steps.";

            recommendations.Add(new RecommendedSubjectDto(subject.Id, subject.Name, subject.Code, reason));
        }

        return recommendations;
    }
}
