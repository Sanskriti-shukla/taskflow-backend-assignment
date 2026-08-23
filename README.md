# TaskFlow Backend

TaskFlow is a lightweight multi-tenant project management backend built for the Backend Developer technical assignment.

This version intentionally follows a simple Express + Sequelize folder style:

```text
Route -> Controller -> Service -> Repository -> Sequelize Model -> PostgreSQL
```

The structure is kept close to a typical existing Node.js/Express project so each layer is easy to trace and explain.

## Tech Stack

- Node.js 20
- Express.js
- Sequelize ORM
- PostgreSQL 16
- Redis 7
- BullMQ
- JWT + bcrypt
- Zod validation
- Swagger / OpenAPI
- Jest + Supertest
- Docker Compose

## Folder Structure

```text
src/
|-- api-docs/        # Swagger YAML
|-- common/          # Shared helpers/errors/pagination
|-- config/          # PostgreSQL + Redis config
|-- constants/       # Response/message constants
|-- controller/      # Request/response handling
|-- enums/           # Role/status/priority values
|-- middleware/      # JWT, admin RBAC, validation, rate limit
|-- migrations/      # Sequelize migration up/down files
|-- models/          # Sequelize models + associations
|-- queue/           # BullMQ queues
|-- repository/      # Database access
|-- routes/          # Express routes
|-- seed/            # Demo seed data
|-- services/        # Business logic
|-- utils/           # Swagger helper
|-- worker/          # Async email worker
```

## Quick Start - Docker

### Prerequisites

- Docker Desktop
- Docker Compose

### Run

From the project folder:

```bash
docker compose up --build
```

Or on Windows double-click:

```text
run.bat
```

Docker starts all required assignment services:

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- BullMQ worker: separate `worker` container

The API container automatically runs:

```text
migration:run -> seed -> API start
```

The worker waits until the database schema exists and then starts separately.

## Demo Login

All seeded users use:

```text
Password123!
```

Acme:

```text
alice@taskflow.test   org_admin
bob@taskflow.test     member
carol@taskflow.test   member
organization slug: acme
```

Globex:

```text
dave@taskflow.test    org_admin
eve@taskflow.test     member
organization slug: globex
```

Example login:

```json
{
  "email": "alice@taskflow.test",
  "password": "Password123!",
  "organizationSlug": "acme"
}
```

## Main Endpoints

Authentication:

```text
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
POST /auth/logout-all
```

Members:

```text
GET    /members
POST   /members                 org_admin
PATCH  /members/:userId         org_admin
DELETE /members/:userId         org_admin
```

Projects:

```text
POST   /projects
GET    /projects
GET    /projects/:id
PUT    /projects/:id
DELETE /projects/:id            org_admin
GET    /projects/:id/dashboard
```

Tasks:

```text
POST   /tasks
GET    /tasks
GET    /tasks/:id
PUT    /tasks/:id
DELETE /tasks/:id
POST   /tasks/:id/assignments
DELETE /tasks/:id/assignments/:userId
PATCH  /tasks/bulk/status
```

Jobs:

```text
GET /jobs/:id
```

Task list filters:

```text
status
priority
assigneeId
projectId
dueFrom
dueTo
search
page
limit
```

Pagination response:

```json
{
  "data": [],
  "total": 0,
  "page": 1,
  "limit": 20
}
```

Error response:

```json
{
  "error": "Forbidden",
  "code": "FORBIDDEN",
  "details": {}
}
```

## Multi-Tenant Security

The client does not provide `organizationId` for protected resource access.

After login the signed access token contains the selected organization context. `src/middleware/JWT.js` verifies the JWT and then verifies that the user is still an `org_member` of that organization.

The middleware attaches:

```js
req.user.data.id
req.user.data.organizationId
req.user.data.role
```

Services pass `organizationId` to repository methods. Project queries directly filter by `organization_id`. Task queries join through the project and filter on the project's `organization_id`.

An inaccessible/cross-tenant project or task returns `403 Forbidden` without returning resource data.

## Authentication Decisions

- bcrypt cost: minimum 12
- access token TTL: 15 minutes
- refresh token TTL: 7 days
- refresh tokens are stored as SHA-256 hashes in PostgreSQL
- refresh tokens support revocation
- refresh token rotation is implemented
- logout-all revokes every refresh token for the user in the active organization
- register/login/refresh/logout are rate-limited to 10 requests/minute/IP

## Background Job Consistency Strategy

Task assignment uses a simple compensating-write strategy that is easy to reason about:

```text
1. Validate task tenant
2. Validate assignee belongs to the same organization
3. Persist task_assignment
4. Enqueue BullMQ email job
5. Return success only when both operations succeed
```

If Redis/BullMQ enqueue fails in step 4, the newly-created task assignment is immediately deleted and the API returns `503 QUEUE_ENQUEUE_FAILED`.

This avoids returning a successful assignment without a notification job. For a very high-scale distributed production system, the next improvement would be a transactional outbox pattern.

## BullMQ Retry / DLQ

Email processing is asynchronous in the separate worker.

- initial attempt + 3 retries
- exponential retry delays: 1s, 2s, 4s
- max 50 email jobs/minute
- after retries are exhausted, the job is copied to `task-email-dlq`
- `/jobs/:id` reports `pending`, `active`, `completed`, or `failed`
- mock email sending is used

To demonstrate a failure, assign a seeded/created user whose email ends in `@fail.test`.

## Database Design

Required tables:

- users
- organizations
- org_members
- projects
- tasks
- task_assignments
- comments

Supporting table:

- refresh_tokens

PostgreSQL enums:

```text
task.status   = todo | in_progress | review | done
task.priority = low | medium | high | urgent
org role      = org_admin | member
```

Projects and tasks use Sequelize `paranoid` soft delete (`deleted_at`).

Task title + description are stored in a generated PostgreSQL `tsvector` with a GIN index for full-text search.

Foreign-key CASCADE/RESTRICT choices and index reasons are documented directly in `src/migrations/001-create-taskflow.js`.

## Migrations

No manually maintained `schema.sql` is used.

Run migrations:

```bash
npm run migration:run
```

Revert latest migration:

```bash
npm run migration:revert
```

## Seed Data

Seed includes:

- 2 organizations
- 5 users
- 4 projects
- 12 tasks
- mixed statuses/priorities
- task assignments
- sample comments

Run manually:

```bash
npm run seed
```

## Tests

A dedicated `taskflow_test` PostgreSQL database is created by Docker.

Run inside the API container:

```bash
docker compose exec api npm test
```

Unit tests:

```bash
docker compose exec api npm run test:unit
```

Integration tests:

```bash
docker compose exec api npm run test:integration
```

Coverage:

```bash
docker compose exec api npm run test:coverage
```

Test coverage includes:

- authentication hashing logic
- task assignment membership validation
- pagination helper
- login flow
- task CRUD
- cross-tenant 403
- validation error contract
- assignment creates BullMQ job

Integration tests reset the dedicated test database to a clean state before every test.

## Postman

Import:

```text
postman/TaskFlow.postman_collection.json
```

The collection has local variables and automatically saves access token, refresh token, project ID, task ID, member ID and job ID as the flow runs.

## Architecture / Demo Notes

See:

```text
docs/ARCHITECTURE.md
docs/HOW_TO_EXPLAIN.md
docs/DEMO_SCRIPT.md
docs/REQUIREMENTS_MATRIX.md
docs/PROJECT_STYLE_MAPPING.md
docs/SUBMISSION_CHECKLIST.md
```

## Assumptions and Limitations

- Email delivery is mocked as permitted by the assignment.
- Job state is kept in Redis/BullMQ; production systems may persist a separate notification audit table.
- Compensation is used for assignment/queue consistency; transactional outbox is noted as a production evolution.
- Full-text search uses PostgreSQL English text search configuration.
- Organization selection is done at login using an organization slug; protected endpoints never trust a client-provided organization ID.
- Docker is the recommended local execution path so PostgreSQL, Redis, API and worker versions stay consistent.

## Optional Local Run Without Docker

If PostgreSQL and Redis are already installed locally:

```bash
cp .env.example .env
npm install
npm run migration:run
npm run seed
npm start
```

In a second terminal:

```bash
npm run worker
```

For Windows PowerShell, copy `.env.example` to `.env` manually if `cp` is unavailable.
