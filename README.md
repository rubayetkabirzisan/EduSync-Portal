# EduSync Portal

EduSync Portal is a role-based university and school management application built with Next.js, ASP.NET Core, and PostgreSQL. It provides dedicated workflows for administrators, teachers, and students while enforcing authorization in both the frontend and backend.

## Live application

- Frontend: [https://edu-sync-portal.vercel.app](https://edu-sync-portal.vercel.app)
- Backend: Render
- Database: Supabase PostgreSQL

## Features

### Administration

- Manage users, classes, sections, subjects, and teaching assignments.
- Publish, edit, and delete notices. Notice mutations are restricted to administrators by the API.
- Create, edit, and delete examination schedules with room and class conflict detection.
- Review leave and scholarship applications.
- Move scholarship applications through review, approval, rejection, and disbursement states.
- Publish subject syllabus content used by student course recommendations.

### Teachers

- Create draft or published assignments for assigned classes and subjects.
- Review submissions, award marks, and provide feedback.
- Record attendance as present, late, excused, or absent.
- Participate in the faculty and student community chat.

### Students

- View and submit published class assignments.
- Update eligible submissions before the deadline.
- View marks and teacher feedback.
- Submit and update pending leave applications.
- Browse scholarships and track application status.
- View examination schedules and attendance history.
- Receive data-driven course recommendations and open published syllabi.
- Use the portal assistant for common workflow questions.

### Platform capabilities

- JWT authentication and role-based API authorization.
- SignalR real-time chat with persisted message history.
- In-app and optional email notifications.
- Responsive light and dark interfaces.
- EF Core migrations and deterministic demo-data seeding.
- Automated backend, frontend, Docker, and browser testing in GitHub Actions.

## Technology stack

- Frontend: Next.js 16.3, React, TypeScript, Tailwind CSS, Axios, SignalR client.
- Backend: ASP.NET Core Web API on .NET 10, C#, Entity Framework Core, SignalR.
- Database: PostgreSQL locally or Supabase in production.
- Chatbot service: Django and ChatterBot.
- Testing: xUnit, EF Core InMemory, and Playwright.
- Deployment: Docker Compose locally, Vercel frontend, Render services, and Supabase PostgreSQL.

## Repository structure

```text
frontend/                         Next.js application
backend/src/Api/                  API entry point and controllers
backend/src/Application/          DTOs, validation, and interfaces
backend/src/Domain/               Entities and enums
backend/src/Infrastructure/       EF Core, migrations, seeding, and services
backend/tests/Api.UnitTests/      Backend regression tests
chatterbot/                       Django chatbot service
tests/e2e/                        Playwright golden-path tests
.github/workflows/ci.yml          CI/CD pipeline
QA_Strategy.md                    Quality assurance strategy and test report
```

## Configuration

Real environment files are ignored by Git. Use [.env.example](./.env.example) as the configuration reference and never commit production credentials.

Important settings include:

```env
ConnectionStrings__DefaultConnection=Host=localhost;Port=5432;Database=assignment_system;Username=postgres;Password=postgres
Jwt__Secret=replace-with-a-long-random-string-min-32-chars
Jwt__Issuer=assignment-system-api
Jwt__Audience=assignment-system-client
ChatbotApiBaseUrl=http://localhost:8000/api/
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5080/api
DJANGO_SECRET_KEY=replace-with-a-long-random-string
```

For manual backend development, place backend settings in `backend/.env`. For Docker Compose, place Compose variables in `.env` at the repository root. The frontend reads its local public API URL from `frontend/.env.local`.

## Run with Docker

Docker Desktop is the simplest way to start PostgreSQL, the API, chatbot service, and frontend together:

```bash
docker compose up --build -d
```

Services:

- Frontend: `http://127.0.0.1:3000`
- API: `http://127.0.0.1:5080`
- API health: `http://127.0.0.1:5080/health`
- Chatbot: `http://127.0.0.1:8000`

The API applies EF Core migrations and seeds demo data during the first startup of an empty database.

To stop the stack without deleting data:

```bash
docker compose down
```

To recreate a completely clean local database:

```bash
docker compose down --volumes --remove-orphans
docker compose up --build -d
```

The first command permanently deletes the local Docker PostgreSQL volume. Do not use it when that data must be preserved.

## Run manually

### Backend

```bash
cd backend/src/Api
dotnet restore
dotnet run
```

The development API runs at `http://127.0.0.1:5080`. Swagger is available at `http://127.0.0.1:5080/swagger` in the Development environment.

### Frontend

```bash
cd frontend
npm install
npx next dev -H 127.0.0.1
```

### Chatbot service

Configure `chatterbot/.env`, install the Python dependencies, apply the Django migrations, and start the service:

```bash
cd chatterbot
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

## Demo credentials

These accounts are created only when the application seeds an empty database:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@school.test` | `Passw0rd!` |
| Teacher | `teacher1@school.test` | `Passw0rd!` |
| Student | `student@school.test` | `Passw0rd!` |

If the accounts were edited in a persistent database, the quick-fill credentials will no longer authenticate. Recreate only a disposable Docker database or restore the account values through an authorized administration workflow.

## Testing

### Backend suite

The backend currently contains 13 automated tests covering assignment authorization, status transitions, marks and deadline boundaries, AI recommendations, chatbot fallback behavior, demo credential seeding, and migration integrity.

```bash
cd backend
dotnet test tests/Api.UnitTests/Api.UnitTests.csproj
```

### Frontend production checks

```bash
cd frontend
npx tsc --noEmit
npm run build
```

### Playwright golden path

The E2E test runs the complete teacher-to-student workflow in Chromium and Firefox:

1. Teacher creates and publishes an assignment.
2. Student submits work.
3. Teacher grades the submission.
4. Student verifies the grade and feedback.

Run it against a healthy stack with the documented demo credentials:

```bash
cd tests/e2e
npm install
npx playwright install
npx playwright test --workers=1
```

The test is intentionally sequential because both browser projects mutate the same database.

## Continuous integration

The GitHub Actions pipeline performs the following checks:

1. Restores, builds, and tests the .NET backend.
2. Builds the Next.js production bundle.
3. Builds the backend and frontend Docker images.
4. Removes the disposable E2E database volume and starts a clean stack.
5. Polls the API and frontend until they are actually ready.
6. Verifies the seeded teacher and student credentials.
7. Runs the Playwright golden path with one worker.
8. Uploads the Playwright report and prints Docker logs when a failure occurs.

The migration integrity regression test specifically ensures the `Exams` table is created before later migrations add `MaxMarks`.

## Known limitations

- Assignment submissions currently accept text rather than uploaded files.
- The course advisor is deterministic and database-driven; it does not call a hosted generative-AI model.
- The assistant includes fast portal-help responses and can fall back to the separately deployed Django chatbot service.
