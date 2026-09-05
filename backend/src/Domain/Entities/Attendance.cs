using System;

namespace AssignmentSystem.Domain.Entities;

public class Attendance
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StudentId { get; set; }
    public User Student { get; set; } = null!;
    
    public Guid SubjectId { get; set; }
    public Subject Subject { get; set; } = null!;
    
    public DateTime Date { get; set; }
    public bool IsPresent { get; set; }
    public string Remarks { get; set; } = string.Empty;
}
