namespace AssignmentSystem.Domain.Enums;

public enum UserRole
{
    Admin,
    Teacher,
    Student
}

public enum AssignmentStatus
{
    Draft,
    Published
}

public enum SubmissionStatus
{
    Submitted,
    Late,
    UnderReview,
    Graded,
    NeedsRevision
}

public enum NoticeAudience
{
    All,
    Teachers,
    Students
}

public enum LeaveStatus
{
    Pending,
    Approved,
    Rejected
}

public enum ScholarshipStatus
{
    Pending,
    UnderReview,
    Approved,
    Rejected,
    Disbursed
}
