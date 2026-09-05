using AssignmentSystem.Application.DTOs.Scholarships;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace AssignmentSystem.Application.Interfaces;

public interface IScholarshipService
{
    Task<ScholarshipDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<ScholarshipDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ScholarshipDto> CreateAsync(CreateScholarshipDto dto, CancellationToken cancellationToken = default);
    
    Task<ScholarshipApplicationDto> ApplyAsync(ApplyScholarshipDto dto, Guid studentId, CancellationToken cancellationToken = default);
    Task<IEnumerable<ScholarshipApplicationDto>> GetApplicationsForScholarshipAsync(Guid scholarshipId, CancellationToken cancellationToken = default);
    Task<IEnumerable<ScholarshipApplicationDto>> GetMyApplicationsAsync(Guid studentId, CancellationToken cancellationToken = default);
    Task UpdateApplicationStatusAsync(Guid applicationId, UpdateScholarshipApplicationDto dto, CancellationToken cancellationToken = default);
}
