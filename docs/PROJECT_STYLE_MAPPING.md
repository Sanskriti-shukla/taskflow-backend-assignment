# TaskFlow - How This Maps to the Existing Express/Sequelize Style

The project is intentionally organized in the same simple pattern as the reference Node.js project:

```text
Route -> Controller -> Service -> Repository -> Sequelize Model -> PostgreSQL
```

## Direct Style Mapping

| Familiar pattern | TaskFlow location | Purpose |
|---|---|---|
| `app.js` | `app.js` | Express setup and route registration |
| `src/routes/*.js` | `src/routes/*.js` | URL + middleware + controller mapping |
| `src/controller/*.js` | `src/controller/*.js` | Request/response handling |
| `src/services/*.js` | `src/services/*.js` | Business logic |
| `src/repository/*.js` | `src/repository/*.js` | Sequelize database calls |
| `src/models/*.js` | `src/models/*.js` | `db.define(...)` Sequelize models |
| `src/models/index.js` | `src/models/index.js` | Model associations |
| JWT middleware | `src/middleware/JWT.js` | Verify token and attach `req.user` |
| response constants/helper | `src/constants/` | Common API response handling |
| Swagger YAML | `src/api-docs/taskflow.yaml` | API documentation |

## Request Flow Example

For `POST /tasks/:id/assignments`:

```text
src/routes/tasks.js
        |
        v
src/middleware/JWT.js
        |
        v
src/controller/taskController.js
        |
        v
src/services/taskService.js
        |
        +--> src/repository/taskRepository.js
        |         |
        |         v
        |     Sequelize/PostgreSQL
        |
        +--> src/queue/emailQueue.js
                  |
                  v
              Redis/BullMQ
                  |
                  v
         src/worker/emailWorker.js
```

## Things That Are Different Only Because the Assignment Requires Them

- PostgreSQL is used instead of another SQL database.
- Redis + BullMQ are used for asynchronous assignment emails.
- A separate `worker.js` process is included.
- Sequelize migrations are used instead of schema synchronization.
- Zod handles request validation.
- Organization context is embedded in the JWT and verified against `org_members` for multi-tenant security.
- Docker Compose starts API, worker, PostgreSQL, and Redis together.

## Interview Explanation

A simple explanation is:

> I kept the application layered as routes, controllers, services, repositories, and Sequelize models. Controllers only deal with HTTP input/output, services contain business rules, and repositories contain database queries. For multi-tenancy, the organization comes from the authenticated JWT context rather than request input. Task assignment writes the assignment first and queues the notification before returning success; if queueing fails, the assignment is compensated by deleting it. The worker consumes BullMQ jobs separately so email processing does not block the API.
