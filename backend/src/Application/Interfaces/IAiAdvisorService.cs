using AssignmentSystem.Application.DTOs.Exams;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace AssignmentSystem.Application.Interfaces;

public record RecommendedSubjectDto(Guid SubjectId, string Name, string Code, string Reason, string Syllabus);

public interface IAiAdvisorService
{
    Task<IEnumerable<RecommendedSubjectDto>> GetRecommendationsAsync(Guid studentId, CancellationToken cancellationToken = default);
}
