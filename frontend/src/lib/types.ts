// ── Auth ────────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  userId: string;
  name: string;
  email: string;
  role: "Admin" | "Teacher" | "Student";
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Teacher" | "Student";
  classId?: string;
  className?: string;
  createdAt: string;
}

// ── Pagination ──────────────────────────────────────────────────────
export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

// ── Users ───────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  classId?: string;
  className?: string;
  createdAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: string;
  classId?: string;
}

// ── Classes ─────────────────────────────────────────────────────────
export interface Class {
  id: string;
  name: string;
  section?: string;
  studentCount: number;
  createdAt: string;
}

export interface CreateClassRequest {
  name: string;
  section?: string;
}

// ── Subjects ────────────────────────────────────────────────────────
export interface Subject {
  id: string;
  name: string;
  code: string;
  createdAt: string;
}

export interface CreateSubjectRequest {
  name: string;
  code: string;
}

// ── Teaching Assignments ────────────────────────────────────────────
export interface TeachingAssignment {
  id: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  createdAt: string;
}

export interface CreateTeachingAssignmentRequest {
  teacherId: string;
  classId: string;
  subjectId: string;
}

// ── Assignments ─────────────────────────────────────────────────────
export interface Assignment {
  id: string;
  title: string;
  description: string;
  deadline: string;
  maxMarks: number;
  status: "Draft" | "Published";
  allowResubmission: boolean;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssignmentRequest {
  title: string;
  description: string;
  deadline: string;
  maxMarks: number;
  classId: string;
  subjectId: string;
  allowResubmission: boolean;
  publishImmediately: boolean;
}

export interface UpdateAssignmentRequest {
  title?: string;
  description?: string;
  deadline?: string;
  maxMarks?: number;
  allowResubmission?: boolean;
}

// ── Submissions ─────────────────────────────────────────────────────
export interface Submission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  content: string;
  status: "Submitted" | "Late" | "UnderReview" | "Graded" | "NeedsRevision";
  marks?: number;
  maxMarks: number;
  feedback?: string;
  submittedAt: string;
  updatedAt: string;
  gradedAt?: string;
}

export interface CreateSubmissionRequest {
  assignmentId: string;
  content: string;
}

export interface GradeSubmissionRequest {
  marks: number;
  feedback?: string;
}
