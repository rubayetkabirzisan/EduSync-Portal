# EduSync Portal Quality Assurance Strategy

This document describes the current testing approach, CI quality gates, regression coverage, and notable defects resolved in EduSync Portal.

## 1. Quality objectives

The QA strategy prioritizes:

- Correct role-based authorization at the API boundary.
- Reliable assignment, attendance, leave, scholarship, notice, examination, and chat workflows.
- Safe state transitions and validation of business rules.
- Consistent behavior across Chromium and Firefox.
- Repeatable tests that do not depend on production data.
- Successful schema creation from an empty PostgreSQL database.
- Useful diagnostics when a CI dependency or test fails.

## 2. Test layers

### Backend unit and regression tests

The xUnit suite uses isolated EF Core InMemory databases where database-provider behavior is not under test. Each relevant test creates a unique database name to prevent state leakage.

The current 13-test suite covers:

- Teacher-to-class and teacher-to-subject authorization.
- Assignment draft and published states.
- Student class-membership restrictions.
- Submission deadlines and resubmission restrictions.
- Marks boundaries and graded-submission immutability.
- Safe submission status transitions.
- Data-driven AI advisor recommendations.
- Chatbot portal-help responses and fallback behavior.
- Successful authentication with seeded teacher and student credentials.
- Migration integrity for creation of the `Exams` table.

Run the suite with:

```bash
cd backend
dotnet test tests/Api.UnitTests/Api.UnitTests.csproj
```

### Frontend compile and production-build checks

TypeScript compilation catches invalid component contracts and API model mismatches. The Next.js production build verifies route compilation and static page generation.

```bash
cd frontend
npx tsc --noEmit
npm run build
```

### End-to-end browser tests

Playwright validates the primary full-stack workflow in Chromium and Firefox:

1. A teacher authenticates, creates an assignment, and publishes it.
2. A student authenticates and submits work.
3. The teacher authenticates again and records marks and feedback.
4. The student authenticates again and verifies the result.

Each assignment title contains a timestamp so locators can select the record created by the active test run. Browser projects run sequentially with `--workers=1` because they mutate the same E2E database.

The login helper waits for the `POST /api/auth/login` response, asserts HTTP 200, includes the response body in assertion failures, and allows additional time for the role-based redirect. This distinguishes authentication failures from navigation timeouts.

## 3. CI environment strategy

The GitHub Actions pipeline uses an isolated Docker Compose stack containing PostgreSQL, the ASP.NET Core API, the Django chatbot, and the Next.js frontend.

The E2E job performs these steps:

1. Removes containers, orphaned resources, and the disposable PostgreSQL volume from a previous run.
2. Builds and starts a clean Compose stack.
3. Polls `/health` and `/login` instead of relying on a fixed startup delay.
4. Calls the login API for both required demo accounts before installing or running Playwright.
5. Runs Playwright using a single worker.
6. Prints API and database logs automatically on failure.
7. Uploads the Playwright HTML report for investigation.

The E2E volume is disposable. Production and developer databases must never be deleted as part of automated testing.

## 4. Database migration assurance

EF Core migrations must support both scenarios:

- A clean PostgreSQL database applying the complete migration chain in chronological order.
- An existing deployment whose tables predate complete migration-history tracking.

For a clean database, every migration must create its prerequisite objects before a later migration alters them. The current expected sequence includes:

```text
AddExams creates Exams
    -> AddExamMaxMarks alters Exams
    -> AddAttendanceStatus updates Attendances
    -> AddSubjectSyllabus alters Subjects
    -> demo data is seeded
```

The generated migration SQL is checked during development to confirm that `CREATE TABLE "Exams"` occurs before `ALTER TABLE "Exams" ADD "MaxMarks"`. A unit regression test also inspects the `AddExams` migration operations and verifies its essential columns.

## 5. Key defects discovered and resolved

### Empty examination migration broke clean deployments

**Symptom:** GitHub Actions received `401 Unauthorized` when Playwright attempted to authenticate as the seeded teacher.

**Root cause:** `20260905072548_AddExams` contained an empty `Up` method even though its designer snapshot contained the `Exam` model. EF recorded that migration without creating the table. `AddExamMaxMarks` then failed with `relation "Exams" does not exist`. Later migrations did not execute, the `Subjects.Syllabus` column was absent, demo seeding rolled back, and no login accounts were created.

**Resolution:** The migration now creates the `Exams` table, indexes, and class/subject foreign keys. Its `Down` method removes the table. Generated SQL ordering was verified, and a migration integrity regression test was added. The repaired workflow passed CI.

### Opaque E2E authentication timeout

**Symptom:** Playwright reported only that the browser remained on `/login`, hiding the API response that caused the failure.

**Resolution:** The login helper now waits for the exact login request, validates its status, and reports the response body. CI separately validates both demo credentials before browser execution.

### Fixed startup delay was unreliable

**Symptom:** Service startup timing varied with image startup, migrations, database initialization, and runner load.

**Resolution:** CI replaced the fixed 15-second sleep with bounded readiness polling for both the API and frontend. On timeout, Docker logs are printed immediately.

### Persistent test data invalidated demo credentials

**Symptom:** Tests could encounter changed or missing demo accounts when an existing Docker volume was reused.

**Resolution:** The CI E2E job explicitly removes its disposable database volume before startup. A backend regression test verifies that seeding an empty database creates working teacher and student credentials.

### Parallel browsers mutated shared state

**Symptom:** One browser could submit or grade data while another browser expected an earlier state.

**Resolution:** State-mutating browser tests use `--workers=1`. Unique assignment titles prevent collisions between repeated executions.

### Cross-origin IPv4 mismatch

**Symptom:** Requests from `http://127.0.0.1:3000` were rejected when the API allowed only `http://localhost:3000`.

**Resolution:** Development CORS configuration permits both loopback forms, and the local test stack consistently uses explicit IPv4 addresses.

### Next.js Docker and Vercel output conflict

**Symptom:** Vercel could not consume a build configured unconditionally for Next.js standalone Docker output.

**Resolution:** Standalone output is enabled only when `DOCKER_BUILD=1`. The Docker API URL is supplied as a build argument because `NEXT_PUBLIC_*` values are embedded during the Next.js build.

### SignalR connection failures obscured chat behavior

**Symptom:** Failed or interrupted WebSocket negotiation triggered development error overlays.

**Resolution:** Chat connection handling was made lifecycle-safe, and persisted community messages remain available through the API when a real-time connection is re-established.

### Student data visibility and IDOR risks

**Symptom:** A student could potentially request published or draft assignment data outside their class by identifier.

**Resolution:** Student detail endpoints verify publication state and authenticated class membership. Unauthorized records are not disclosed.

### Submission grading bypass

**Symptom:** A generic status endpoint could be used to mark a submission as graded without marks or feedback.

**Resolution:** Generic status changes are restricted to explicitly allowed states. Grading must use the dedicated grading workflow, where marks boundaries are validated.

### Unsafe enum parsing

**Symptom:** Invalid role or status strings could produce unhandled exceptions.

**Resolution:** External enum values use safe parsing and return controlled validation errors.

### Fire-and-forget notification scope disposal

**Symptom:** Bulk assignment notifications could continue after request-scoped dependencies had been disposed.

**Resolution:** Notification operations are awaited, and individual recipient failures do not abort delivery to remaining recipients.

### Environment and secret handling

**Symptom:** Local database and provider credentials risked being placed in tracked configuration.

**Resolution:** Real `.env` files are ignored, `.env.example` contains placeholders, production values are injected by the hosting environment, and the Django secret is configurable through `DJANGO_SECRET_KEY`.

## 6. Entry and exit criteria

A change is ready to merge when all applicable checks pass:

- Backend Release build succeeds without errors.
- All backend tests pass.
- TypeScript compilation and the Next.js production build pass.
- EF reports no pending model changes when entities were modified.
- Migration SQL supports a clean database when schema changes are included.
- Changed frontend files pass lint checks.
- The Playwright golden path passes when shared workflows are affected.
- No real environment files or secrets are staged.

## 7. Current limitations and future improvements

- Docker execution requires a host with Docker Desktop or Docker Engine; static YAML validation alone does not exercise container startup.
- The main browser matrix excludes WebKit because the Windows development environment previously showed unstable loopback behavior.
- Provider-specific PostgreSQL behavior is primarily exercised by the Docker E2E environment; most service tests use EF Core InMemory for speed.
- Additional E2E scenarios should cover notices, leave applications, scholarships, exams, attendance, and real-time chat independently of the assignment golden path.
- Full frontend linting still includes legacy findings outside recently changed modules and should become a dedicated cleanup gate.
