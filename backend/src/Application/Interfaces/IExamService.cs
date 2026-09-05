using AssignmentSystem.Application.DTOs.Exams;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace AssignmentSystem.Application.Interfaces;

public interface IExamService
{
    Task<ExamDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<ExamDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ExamDto> CreateAsync(CreateExamDto dto, CancellationToken cancellationToken = default);
}
