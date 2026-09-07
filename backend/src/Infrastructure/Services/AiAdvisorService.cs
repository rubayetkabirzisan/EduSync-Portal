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

        // Prefer subjects outside the student's current class as possible next steps.
        var availableSubjects = await _context.Subjects
            .Where(s => !enrolledSubjectIds.Contains(s.Id))
            .OrderBy(s => s.Name)
            .ToListAsync(cancellationToken);

        // If there are fewer than three new subjects, fill the plan with subjects from
        // the student's current class so the advisor still provides useful guidance.
        var currentSubjects = await _context.Subjects
            .Where(s => enrolledSubjectIds.Contains(s.Id))
            .OrderBy(s => s.Name)
            .ToListAsync(cancellationToken);

        var candidates = availableSubjects
            .Concat(currentSubjects)
            .DistinctBy(subject => subject.Id)
            .Take(3)
            .ToList();

        var subjectPerformance = await _context.Submissions
            .Where(submission =>
                submission.StudentId == studentId &&
                submission.Marks.HasValue &&
                submission.Assignment.MaxMarks > 0)
            .GroupBy(submission => submission.Assignment.SubjectId)
            .Select(group => new
            {
                SubjectId = group.Key,
                AveragePercentage = group.Average(submission =>
                    submission.Marks!.Value * 100.0 / submission.Assignment.MaxMarks)
            })
            .ToDictionaryAsync(
                item => item.SubjectId,
                item => item.AveragePercentage,
                cancellationToken);

        var recommendations = new List<RecommendedSubjectDto>();
        foreach (var subject in candidates)
        {
            var isCurrentSubject = enrolledSubjectIds.Contains(subject.Id);
            var reason = isCurrentSubject
                ? BuildCurrentSubjectReason(subject.Name, subjectPerformance.GetValueOrDefault(subject.Id))
                : $"{subject.Name} is available outside your current class subjects and is a possible next step for broadening your study plan.";

            recommendations.Add(new RecommendedSubjectDto(subject.Id, subject.Name, subject.Code, reason, subject.Syllabus));
        }

        return recommendations;
    }

    private static string BuildCurrentSubjectReason(string subjectName, double averagePercentage)
    {
        if (averagePercentage <= 0)
            return $"{subjectName} is part of your current class plan. Complete graded work in this subject to receive more performance-specific guidance.";

        if (averagePercentage < 60)
            return $"Your graded work averages {averagePercentage:F0}% in {subjectName}. Prioritizing this subject can help strengthen the areas where you need the most support.";

        if (averagePercentage >= 85)
            return $"Your graded work averages {averagePercentage:F0}% in {subjectName}. You are performing strongly and may be ready for more advanced work in this area.";

        return $"Your graded work averages {averagePercentage:F0}% in {subjectName}. Continuing this subject will help you build on your current progress.";
    }
}
