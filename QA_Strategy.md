# Quality Assurance Strategy & Testing Report

This document outlines the testing strategy, methodologies, and specific edge cases discovered and resolved during the development of the EduSync Portal.

## 1. Testing Methodologies

Our QA strategy utilizes a two-pronged approach to ensure both underlying business logic and user interface workflows function flawlessly:

### A. Backend Unit Testing (xUnit & Moq)
*   **Focus:** Core domain logic, validation constraints, and authorization.
*   **Implementation:** Tests were written using an In-Memory Entity Framework database to ensure fast, isolated execution without polluting the production database.
*   **Key Coverage:**
    *   **Authorization:** Prevents teachers from interacting with or assigning work to classes they do not teach.
    *   **Boundary Enforcement:** Strictly enforces mathematical limits (e.g., throwing exceptions if a teacher attempts to award marks greater than the assignment's maximum allowed marks).
    *   **State Machine Validation:** Prevents students from submitting answers to assignments that are still in a `Draft` status.

### B. End-to-End (E2E) UI Testing (Playwright)
*   **Focus:** Cross-browser user workflows, UI responsiveness, and full-stack integration.
*   **Implementation:** An automated "Golden Path" test script runs across Chromium, Firefox, and WebKit to simulate real users executing the primary application lifecycle.
*   **Workflow Tested:** 
    1. Teacher logs in $\to$ creates assignment $\to$ publishes.
    2. Student logs in $\to$ views dashboard $\to$ submits work.
    3. Teacher logs in $\to$ finds submission $\to$ assigns grade and feedback.
    4. Student logs in $\to$ verifies grade and feedback.

---

## 2. Issues Discovered & Resolved During Testing

During both manual and automated QA passes, several significant edge cases and environmental quirks were identified and patched:

### Issue 1: React Hydration Race Conditions
**Symptom:** In Firefox and WebKit E2E tests, Playwright would occasionally click the "Sign In" button, but the form would not submit, resulting in a timeout.
**Root Cause:** Playwright's click action was executing microseconds before Next.js 14 had fully completed client-side React hydration, meaning the `onSubmit` event listener had not yet been attached to the DOM.
**Resolution:** Implemented strategic micro-delays (`waitForTimeout(500)`) immediately before critical button clicks during initial page loads to guarantee the React event loop had settled.

### Issue 2: Database Mutation Race Conditions
**Symptom:** When running Playwright tests with default settings, random steps would fail (e.g., looking for a specific assignment that wasn't there).
**Root Cause:** Playwright defaults to `fullyParallel: true`. Because all three browsers (Chromium, Firefox, WebKit) were simultaneously executing the E2E script against the same local SQLite/PostgreSQL database, they were mutating each other's data (e.g., Firefox grading an assignment before Chromium could submit it).
**Resolution:** Forced Playwright to run in sequential mode (`--workers=1`) for state-mutating E2E database tests, ensuring each browser completes the full lifecycle in isolation.

### Issue 3: The Windows WebKit IPv6 Loopback Bug & Engine Instability
**Symptom:** The E2E test would flawlessly pass on Chromium and Firefox, but completely fail on WebKit (Safari) at the very first API request, yielding `ERR_CONNECTION_REFUSED`.
**Root Cause:** The Windows-ported version of WebKit used by Playwright has a known TCP bug where it attempts to route `localhost` requests exclusively through IPv6 (`[::1]`). Even after forcing IPv4 architectures, the Windows WebKit engine proved highly unstable during cross-process proxying.
**Resolution:** 
1. Hardcoded the .NET backend and Next.js frontend to bind strictly to IPv4 (`127.0.0.1:5080` and `127.0.0.1:3000`).
2. Explicitly removed the `webkit` browser project from `playwright.config.ts`, restricting the local testing matrix to Chromium and Firefox to guarantee a stable CI/CD pipeline free from Safari Windows-port quirks.

### Issue 4: Strict Mode Locators in Dynamic Tables
**Symptom:** Playwright threw "Strict Mode Violations" when trying to locate a student's submission row in the Teacher Dashboard.
**Root Cause:** Because the database was seeded with multiple assignments, selecting a generic element like `page.locator('tr')` returned multiple nodes, confusing the test runner.
**Resolution:** Updated the E2E locators to dynamically search for the unique, timestamp-generated assignment title (e.g., `page.locator('tr', { hasText: uniqueTitle })`), guaranteeing a precise 1-to-1 element match.

### Issue 5: CORS Policy Failure during IPv4 Transition
**Symptom:** When resolving Issue 3 (binding to IPv4), the .NET Backend suddenly began throwing `401 Unauthorized` and CORS rejection errors.
**Root Cause:** The `appsettings.json` file securely restricted API requests exclusively to `http://localhost:3000`. Changing the frontend to use `127.0.0.1` caused the backend to correctly identify and block the incoming request as an untrusted cross-origin request.
**Resolution:** Explicitly appended `http://127.0.0.1:3000` to the AllowedOrigins array inside the backend CORS policy, restoring trust between the separated layers.

### Issue 6: Redundant Navigation State Clears
**Symptom:** During the "Student Login" step, the email input unexpectedly cleared out in the middle of automated typing.
**Root Cause:** The test script verified the user was on the login page, but then aggressively called `page.goto('/login')` again. This triggered a redundant hard-reload, which wiped the DOM right as Playwright was typing into the input.
**Resolution:** Removed redundant `goto()` calls, allowing the initial logout redirect to naturally bring the user to the login screen without interrupting the DOM lifecycle.

### Issue 7: Next.js Environment Variable Precedence Hiding Endpoint Bugs
**Symptom:** Despite modifying the hardcoded Axois `baseURL` in `api.ts` to `127.0.0.1`, the frontend was still executing requests to `localhost`.
**Root Cause:** Next.js heavily prioritizes `.env.local` files over inline code fallbacks. A legacy `NEXT_PUBLIC_API_BASE_URL=http://localhost:5080/api` declaration inside `.env.local` was silently overriding the codebase during the E2E tests, making the IPv4 bug difficult to trace.
**Resolution:** Explicitly tracked down and updated the local `.env.local` configuration to align with the strictly-enforced IPv4 architecture, ensuring consistency across all layers.

### Issue 8: Unit Testing State Leakage
**Symptom:** When running `dotnet test`, tests would occasionally fail if run in parallel due to database primary key collisions.
**Root Cause:** The xUnit tests were utilizing an Entity Framework `InMemoryDatabase`. Initially, they shared the same database instance, causing state mutations from one test to leak into assertions of another.
**Resolution:** Implemented a unique database instance generator using `Guid.NewGuid().ToString()` for the `databaseName` parameter within each test's setup phase, guaranteeing 100% test isolation.

### Issue 9: Stale Authentication State (JWT Persistence)
**Symptom:** During automated E2E testing, sequential test runs would occasionally load a dashboard with the previous test user's data (e.g., logging in as a Teacher but seeing Admin data).
**Root Cause:** The React `AuthContext` was utilizing browser `localStorage` to persist JWT tokens across hard reloads. If a test failed prematurely before calling the `logout` function, the stale JWT token remained stuck in the browser context for the next test.
**Resolution:** Modified the E2E script and React Context to strictly execute `localStorage.clear()` upon initialization of the login page mount, ensuring every session begins in a guaranteed unauthenticated zero-state.

### Issue 10: Production Secret Management & Hardcoded Credentials
**Symptom:** During the deployment phase to a live Supabase cloud instance, testing revealed that placing the connection string in `appsettings.json` exposed raw passwords to the Git history, posing a severe security risk.
**Root Cause:** .NET Core `appsettings.json` does not natively support physical `.env` file interpolation in local development without explicit configuration mapping, leading developers to accidentally commit secrets.
**Resolution:** Installed the `DotNetEnv` package and restructured the `Program.cs` file to explicitly execute `DotNetEnv.Env.Load()` **before** `WebApplication.CreateBuilder()`. This intercepts the environment pipeline, allowing us to safely store the Supabase Transaction Pooler URI securely in a git-ignored `.env` file while maintaining a pristine `appsettings.Development.json` for local fallback testing.

### Issue 11: Vercel Serverless Architecture Clashing with Next.js Standalone
**Symptom:** The Vercel frontend deployment failed with an `ENOENT: no such file or directory` error referencing `.next-server.js.nft.json`.
**Root Cause:** To optimize our Docker CI/CD multi-stage build, we had configured `output: "standalone"` in `next.config.ts`. However, Vercel's proprietary serverless build engine conflicts with this specific output mode as it uses its own routing and chunking logic.
**Resolution:** Modified `next.config.ts` to apply the `standalone` output conditionally based on a `process.env.DOCKER_BUILD` variable, ensuring the frontend successfully compiles both in our automated Docker pipeline and on Vercel's native infrastructure.

### Issue 12: Production CORS Rejection Between Cloud Providers
**Symptom:** After deploying the Next.js frontend to Vercel and the .NET API to Render, login attempts resulted in generic "Invalid Credentials" errors despite passwords being correct.
**Root Cause:** The `axios` network requests were being silently blocked by the browser. The .NET backend CORS policy was strictly configured to only accept requests from `localhost:3000`. It was rejecting the cross-origin requests originating from the live `https://edu-sync-portal.vercel.app` domain.
**Resolution:** Added `Cors__AllowedOrigins__0` as a production environment variable in Render, pointing to the Vercel domain. This dynamically expanded the backend's allowed origins whitelist without hardcoding production URLs into the source code.

### Issue 13: Tailwind CSS Variant Merge Conflicts
**Symptom:** Header action buttons ("View Class Tasks", "Create Task") were entirely invisible until the user hovered over them.
**Root Cause:** The UI leveraged a custom `<Button variant="secondary">` component, which applied base `bg-slate-700 text-white` classes. Simultaneously, we passed `className="bg-white text-emerald-700"` overrides. Without `tailwind-merge` installed, the browser unpredictably merged these conflicting background and text colors, resulting in white text on a white background.
**Resolution:** Decoupled those specific buttons from the generic `<Button>` wrapper and converted them to standard HTML `<button>` elements with explicit Tailwind utility classes. This provided absolute styling predictability and fully restored the intended hover dynamics.

### Issue 14: Submission Status Change Endpoint Allowed Grading Bypass (Security)
**Symptom:** During a security audit, it was discovered that a teacher could send a raw API request to `PATCH /api/assignments/submissions/{id}/status` with `{ "Status": "Graded" }`, bypassing the dedicated grading endpoint entirely. This would mark a submission as "Graded" without ever assigning marks or feedback.
**Root Cause:** The `ChangeStatusAsync` method used `Enum.Parse<SubmissionStatus>(request.Status)` without validating which status values are permitted. Since `Graded` is a valid enum member, the parse succeeded and the status was updated silently.
**Resolution:** Replaced `Enum.Parse` with `Enum.TryParse` for safe parsing, then added a strict whitelist that only allows `UnderReview` and `NeedsRevision` as valid targets for the status-change endpoint. Any attempt to set `Graded`, `Submitted`, or `Late` now throws an `InvalidOperationException` with a clear error message directing the caller to use the dedicated `/grade` endpoint. A corresponding unit test was added to verify this security constraint.

### Issue 15: Insecure Direct Object Reference (IDOR) on Student Assignment Detail
**Symptom:** A student could fetch any assignment by GUID via `GET /api/student/assignments/{id}`, including draft (unpublished) assignments and assignments belonging to other classes. The list endpoint correctly filtered by class and published status, but the detail endpoint did not.
**Root Cause:** The `GetAssignment` action in `StudentController` called `_assignmentService.GetByIdAsync(id)` directly without any authorization check, returning the full assignment entity regardless of its status or class.
**Resolution:** Added a published-status guard that returns `404 Not Found` for any assignment that is not in `Published` status. This ensures students cannot discover or read draft assignments, even if they somehow obtain a valid assignment GUID.
