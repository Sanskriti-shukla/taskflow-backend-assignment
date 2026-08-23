# TaskFlow Demo Script

Target recording length: 5-8 minutes.

## 1. Start with architecture

Show the repository folders and explain:

```text
routes -> controllers -> services -> repositories -> models
```

Mention PostgreSQL + Redis/BullMQ and separate worker.

## 2. Start Docker

```bash
docker compose up --build
```

Show API, worker, PostgreSQL and Redis are running.

## 3. Open Swagger

```text
http://localhost:3000/docs
```

## 4. Login

Use:

```text
alice@taskflow.test
Password123!
acme
```

Copy access token into Swagger Authorize.

## 5. Projects and tasks

- `GET /projects`
- `POST /projects`
- `POST /tasks`
- `GET /tasks?status=todo&priority=high`
- `GET /projects/:id/dashboard`

## 6. Assignment worker

- `GET /members`
- choose a member
- `POST /tasks/:id/assignments`
- copy returned job ID
- show worker console printing the mock email
- `GET /jobs/:id`

## 7. Multi-tenant protection

Login as `dave@taskflow.test` / `globex` and copy one Globex project ID.

Login back as Alice / Acme and call `GET /projects/<globex-id>`.

Show `403 FORBIDDEN` and that the response contains no project information.

## 8. Database/migration

Open `src/migrations/001-create-taskflow.js` and briefly point to:

- PostgreSQL enums
- foreign keys
- CASCADE/RESTRICT comments
- indexes
- generated tsvector + GIN index

## 9. Tests

Run:

```bash
docker compose exec api npm test
```

Mention dedicated test DB + clean state reset.
