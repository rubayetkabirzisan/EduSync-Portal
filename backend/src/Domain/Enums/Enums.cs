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
