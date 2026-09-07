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

// ── Dashboard Stats ─────────────────────────────────────────────────
export interface StudentDashboardStatsDto {
  enrolledCourses: number;
  pendingAssignments: number;
  upcomingExams: number;
  averageAttendancePercentage: number;
  activeScholarshipStatus: string;
}

export interface TeacherDashboardStatsDto {
  assignedClasses: number;
  totalStudentsTaught: number;
  upcomingExams: number;
  pendingAssignmentGrades: number;
}

export interface AdminDashboardStatsDto {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  pendingLeaves: number;
  pendingScholarships: number;
}

// ── Notices ─────────────────────────────────────────────────────────
export type NoticeAudience = 0 | 1 | 2;

export interface Notice {
  id: string;
  title: string;
  content: string;
  audience: NoticeAudience;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoticeRequest {
  title: string;
  content: string;
  audience: NoticeAudience;
}

export interface UpdateNoticeRequest {
  title?: string;
  content?: string;
  audience?: NoticeAudience;
}

// ── Leaves ──────────────────────────────────────────────────────────
export interface LeaveApplication {
  id: string;
  studentId: string;
  studentName: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: "Pending" | "Approved" | "Rejected";
  adminFeedback?: string;
  createdAt: string;
}

export interface CreateLeaveRequest {
  reason: string;
  startDate: string;
  endDate: string;
}

export interface UpdateLeaveStatusRequest {
  status: "Approved" | "Rejected";
  adminFeedback?: string;
}

// ── Scholarships ────────────────────────────────────────────────────
export interface Scholarship {
  id: string;
  name: string;
  description: string;
  amount: number;
  deadline: string;
  createdAt: string;
}

export interface CreateScholarshipRequest {
  name: string;
  description: string;
  amount: number;
  deadline: string;
}

export interface ScholarshipApplication {
  id: string;
  scholarshipId: string;
  scholarshipName?: string;
  studentId: string;
  studentName?: string;
  reason: string;
  status: "Pending" | "UnderReview" | "Approved" | "Rejected" | "Disbursed";
  adminFeedback?: string;
  createdAt: string;
}

export interface ApplyScholarshipRequest {
  scholarshipId: string;
  reason: string;
}

export interface UpdateScholarshipApplicationRequest {
  status: "UnderReview" | "Approved" | "Rejected" | "Disbursed";
  adminFeedback?: string;
}

// ── Notifications ───────────────────────────────────────────────────
export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ── Attendance ──────────────────────────────────────────────────────
export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName?: string;
  classId: string;
  className?: string;
  date: string;
  status: "Present" | "Absent" | "Late" | "Excused";
  recordedByTeacherId: string;
  recordedByTeacherName?: string;
  createdAt: string;
}

export interface MarkAttendanceRequest {
  studentId: string;
  classId: string;
  date: string;
  status: "Present" | "Absent" | "Late" | "Excused";
}

// ── Exams ───────────────────────────────────────────────────────────
export interface Exam {
  id: string;
  title: string;
  classId: string;
  className?: string;
  subjectId: string;
  subjectName?: string;
  startTime: string;
  durationMinutes: number;
  maxMarks: number;
  roomName: string;
  createdAt: string;
}

export interface CreateExamRequest {
  title: string;
  classId: string;
  subjectId: string;
  startTime: string;
  durationMinutes: number;
  maxMarks: number;
  roomName: string;
}

// ── AI Advisor ──────────────────────────────────────────────────────
export interface RecommendedSubjectDto {
  subjectId: string;
  name: string;
  code: string;
  reason: string;
}

// ── Community Chat ──────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string;
}
