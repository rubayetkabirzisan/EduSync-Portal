# EduSync Portal - Assignment & Submission Management System

A role-based school/college application built as a recruitment project, evaluating requirements understanding, system design, API development, frontend implementation, and testing.

## 🌐 Live Demo
The application is fully containerized, CI/CD automated, and deployed to the cloud!
* **Live Site (Frontend):** [https://edu-sync-portal.vercel.app](https://edu-sync-portal.vercel.app)
* **API Backend:** Render.com
* **Database:** Supabase PostgreSQL

## 🚀 Project Overview
EduSync Portal is a modern, robust, and highly secure web application that allows teachers to create and grade assignments, students to submit their work, and administrators to oversee the entire educational ecosystem. 

It implements strict Role-Based Access Control (RBAC), preventing unauthorized access across all API endpoints and frontend routes.

## ✨ Core Features
*   **Role-Based Dashboards:** Dedicated, secure portals for Admins, Teachers, and Students.
*   **Assignment Lifecycle:** Teachers can draft, publish, and grade assignments with feedback. Students can submit and update their work before deadlines.
*   **Automated Validation:** Business logic strictly enforced (e.g., impossible to grade beyond max marks, impossible to submit to a draft assignment).
*   **Security Hardening:** Status-change endpoints are whitelisted to prevent workflow bypass. Student endpoints enforce class membership and published-status checks to prevent IDOR attacks.
*   **Email Notifications:** Integrates with Resend API to automatically alert students when new assignments are published or their submissions are graded.
*   **Premium UI/UX:** Responsive, fully interactive glassmorphism design powered by Tailwind CSS.

## 🛠️ Technology Stack
*   **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS (with Glassmorphism design), Axios.
*   **Backend:** ASP.NET Core Web API (.NET 10), C#, Entity Framework Core.
*   **Database:** PostgreSQL.
*   **Authentication:** JWT (JSON Web Tokens).
*   **Email:** Resend.com API (for automated notifications).
*   **Testing:** xUnit (Backend Unit Tests), Playwright (E2E UI Tests).

## 🗂️ Project Structure
*   `/frontend` - Contains the Next.js application.
*   `/backend/src/Api` - The ASP.NET Core API entry point.
*   `/backend/src/Application` - Business logic and DTOs.
*   `/backend/src/Domain` - Entities and Enums.
*   `/backend/src/Infrastructure` - EF Core DB Context, Migrations, and database seeding.
*   `/backend/tests/Api.UnitTests` - xUnit tests for the backend.
*   `/tests/e2e` - Playwright E2E UI testing suite.

## ⚙️ Setup & Run Instructions

### 1. Database Setup (Supabase / PostgreSQL)
The backend utilizes Entity Framework Core and is configured to connect to PostgreSQL. It securely loads credentials using the `DotNetEnv` package.

1. Create a new file named `.env` in the `backend/` directory.
2. Add your database connection string using the following exact variable name:
```env
ConnectionStrings__DefaultConnection="Host=aws-0-eu-central-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.[project_id];Password=[your_password]"
```
3. If testing email notifications, add your Resend API Key:
```env
Resend__ApiKey=re_your_api_key_here
```
*(Note: If you do not provide a `.env` file, the API will automatically fall back to the local development database specified in `appsettings.Development.json`.)*

3. Apply the initial EF Core migrations (the API will automatically run these on startup, but you can force them if needed):
```bash
cd backend/src/Api
dotnet ef database update
```

### 2. Running the Backend (.NET)
1. Navigate to the API folder:
   ```bash
   cd backend/src/Api
   ```
2. Start the server:
   ```bash
   dotnet run
   ```
3. The API will start on **http://127.0.0.1:5080**. You can view the interactive Swagger/OpenAPI documentation at `http://127.0.0.1:5080/swagger`.

### 3. Running the Frontend (Next.js)
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend server, binding specifically to IPv4 to prevent Windows/Node.js loopback networking quirks:
   ```bash
   npx next dev -H 127.0.0.1
   ```
4. Access the web app at **http://127.0.0.1:3000**.

## 🔑 Demo Credentials
The database automatically seeds these accounts on startup. You can also use the "Quick-Fill" buttons directly on the login page!

| Role    | Email                  | Password   |
| ------- | ---------------------- | ---------- |
| Admin   | admin@school.test      | Passw0rd!  |
| Teacher | teacher1@school.test   | Passw0rd!  |
| Student | student@school.test    | Passw0rd!  |

## 🧪 Testing

### Backend Unit Tests (xUnit)
8 unit tests cover core business rules, authorization constraints, and security edge cases:
*   Authorization denial when a teacher is not assigned to a class/subject.
*   Draft → Published lifecycle transition verification.
*   Marks boundary enforcement (cannot exceed max marks).
*   Student cross-class submission rejection.
*   Graded submission immutability (cannot update after grading).
*   Deadline enforcement on submission updates.
*   Status-change endpoint whitelist (blocks `Graded` bypass via `ChangeStatus`).

```bash
cd backend
dotnet test
```

### End-to-End Tests (Playwright)
An automated browser script simulates the entire "Golden Path" lifecycle: Teacher creates assignment $\to$ Student submits $\to$ Teacher grades $\to$ Student verifies grade.
```bash
cd tests/e2e
npm install
npx playwright install
npx playwright test --workers=1
```

## 📝 Assumptions & Extra Features
*   **IPv4 Enforcement:** To bypass a known cross-origin networking bug in the Windows Playwright WebKit engine, the entire stack (`launchSettings.json`, `.env.local`, and `playwright.config.ts`) has been hardcoded to use `127.0.0.1` instead of `localhost`.
*   **Pagination & Filtering:** All data-heavy endpoints in the backend and frontend utilize `page`, `pageSize`, and status filtering to ensure the app remains highly performant at scale.
*   **Aesthetics:** I prioritized a premium, responsive "Glassmorphism" UI in Tailwind CSS rather than basic HTML tables to demonstrate strong frontend design capabilities.

### Known Limitations
*   **No File Uploads:** For simplicity, the assignment submission process currently accepts rich-text answers rather than physical PDF/Docx file uploads.
