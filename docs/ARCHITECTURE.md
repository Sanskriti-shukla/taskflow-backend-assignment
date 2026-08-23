# TaskFlow Architecture

## High-Level Components

```text
Client / Swagger / Postman
          |
          v
+-----------------------------+
| Express API                 |
| Route -> Controller         |
|       -> Service            |
|       -> Repository         |
+-------------+---------------+
              |
      +-------+-------+
      |               |
      v               v
 PostgreSQL        Redis / BullMQ
      |               |
      |               v
      |          Worker Process
      |               |
      |               v
      |          Mock Email Sender
      |
      +-- Users / Orgs / Projects / Tasks /
          Assignments / Comments / Refresh Tokens
```

## Request Flow

Example `POST /tasks/:id/assignments`:

```text
Route
  -> JWT middleware verifies user + org membership
  -> Controller reads req.user.data.organizationId
  -> TaskService validates tenant and assignee membership
  -> TaskRepository inserts task_assignment
  -> BullMQ queue stores notification job
  -> API returns assignment + jobId
  -> Worker processes job asynchronously
```

## Multi-Tenant Boundary

Organization context is obtained from the verified access token, not from client request data.

Project repository queries include `organizationId` directly. Task repository queries join `tasks -> projects` and require `project.organizationId = authenticated organizationId`.

This means a user from Organization A cannot retrieve a task or project from Organization B using a guessed UUID.

## Database Relationships

```text
organizations 1---* org_members *---1 users
organizations 1---* projects
projects      1---* tasks
tasks         1---* task_assignments *---1 users
tasks         1---* comments         *---1 users
users/orgs    1---* refresh_tokens
```

## Background Job Reliability

The API persists the assignment and then enqueues the notification before returning success. If queue insertion fails, the API compensates by deleting the new assignment and returns 503.

Worker retry configuration:

```text
attempt 1
  -> wait 1s
retry 1
  -> wait 2s
retry 2
  -> wait 4s
retry 3
  -> DLQ after final failure
```

## Security

- bcrypt cost >= 12
- 15-minute access token
- 7-day refresh token
- refresh-token hash stored in DB
- refresh-token rotation
- revocation/logout-all
- JWT + membership re-check on protected requests
- org_admin middleware
- auth rate limiting
- Zod request validation
- Helmet security headers
