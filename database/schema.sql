-- Hand-written fallback schema, kept in sync with the EF Core model in
-- backend/src/Infrastructure/Data. Prefer generating real migrations:
--   cd backend && dotnet ef migrations add InitialCreate -p src/Infrastructure -s src/Api
--   dotnet ef database update -p src/Infrastructure -s src/Api
-- This file exists as the "database script" fallback the assignment brief
-- allows, and as a plain-SQL reference for anyone without the .NET SDK handy.

CREATE TABLE "Classes" (
    "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name" varchar(150) NOT NULL,
    "Section" varchar(50),
    "CreatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "Subjects" (
    "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name" varchar(150) NOT NULL,
    "Code" varchar(30) NOT NULL UNIQUE,
    "CreatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "Users" (
    "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name" varchar(200) NOT NULL,
    "Email" varchar(256) NOT NULL UNIQUE,
    "PasswordHash" text NOT NULL,
    "Role" varchar(20) NOT NULL CHECK ("Role" IN ('Admin', 'Teacher', 'Student')),
    "ClassId" uuid REFERENCES "Classes"("Id") ON DELETE SET NULL,
    "CreatedAt" timestamptz NOT NULL DEFAULT now(),
    "UpdatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "TeachingAssignments" (
    "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "TeacherId" uuid NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "ClassId" uuid NOT NULL REFERENCES "Classes"("Id") ON DELETE CASCADE,
    "SubjectId" uuid NOT NULL REFERENCES "Subjects"("Id") ON DELETE CASCADE,
    "CreatedAt" timestamptz NOT NULL DEFAULT now(),
    UNIQUE ("TeacherId", "ClassId", "SubjectId")
);

CREATE TABLE "Assignments" (
    "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "Title" varchar(250) NOT NULL,
    "Description" text NOT NULL,
    "Deadline" timestamptz NOT NULL,
    "MaxMarks" int NOT NULL,
    "Status" varchar(20) NOT NULL CHECK ("Status" IN ('Draft', 'Published')),
    "AllowResubmission" boolean NOT NULL DEFAULT true,
    "ClassId" uuid NOT NULL REFERENCES "Classes"("Id"),
    "SubjectId" uuid NOT NULL REFERENCES "Subjects"("Id"),
    "TeacherId" uuid NOT NULL REFERENCES "Users"("Id"),
    "CreatedAt" timestamptz NOT NULL DEFAULT now(),
    "UpdatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "IX_Assignments_ClassId_Status" ON "Assignments" ("ClassId", "Status");

CREATE TABLE "Submissions" (
    "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "AssignmentId" uuid NOT NULL REFERENCES "Assignments"("Id") ON DELETE CASCADE,
    "StudentId" uuid NOT NULL REFERENCES "Users"("Id"),
    "Content" text NOT NULL,
    "Status" varchar(20) NOT NULL CHECK ("Status" IN ('Submitted', 'Late', 'UnderReview', 'Graded', 'NeedsRevision')),
    "Marks" int,
    "Feedback" text,
    "SubmittedAt" timestamptz NOT NULL DEFAULT now(),
    "UpdatedAt" timestamptz NOT NULL DEFAULT now(),
    "GradedAt" timestamptz,
    "GradedByTeacherId" uuid,
    UNIQUE ("AssignmentId", "StudentId")
);
