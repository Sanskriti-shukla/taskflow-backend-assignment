# Assignment Requirements Matrix

| Requirement | Implementation |
|---|---|
| Node.js Express/Fastify | Express.js |
| PostgreSQL only | PostgreSQL 16 |
| Redis + BullMQ | `src/queue/emailQueue.js` + worker |
| API + Worker + PostgreSQL + Redis | `docker-compose.yml` |
| users | `src/models/user.js` |
| organizations | `src/models/organization.js` |
| org_members | `src/models/orgMember.js` |
| projects | `src/models/project.js` |
| tasks | `src/models/task.js` |
| task_assignments | `src/models/taskAssignment.js` |
| comments | `src/models/comment.js` |
| FK CASCADE/RESTRICT decisions | `src/migrations/001-create-taskflow.js` comments |
| PostgreSQL status/priority enums | Initial migration |
| Indexes + reasons | Initial migration |
| Migration up/down | `src/migrations/` |
| 2 org / 5 users / 10+ tasks | `src/seed/seed.js` |
| Soft delete | Project/Task `paranoid: true` |
| Full-text search | generated `search_vector` + GIN |
| register/login/refresh/logout | `/auth/*` |
| bcrypt >=12 | `authService.js` |
| access token 15m | `authService.js` |
| refresh token 7d + DB revocation | `refresh_tokens` + service |
| org_admin/member RBAC | enum + admin middleware |
| JWT attaches org context | `middleware/JWT.js` |
| no client org_id trust | middleware/service design |
| cross-tenant 403 | tenant-scoped repositories |
| auth rate limit 10/min/IP | `middleware/rateLimiter.js` |
| refresh rotation | `authService.refresh()` |
| logout all | `/auth/logout-all` |
| project CRUD | `/projects` |
| task CRUD | `/tasks` |
| filters | task repository/query schema |
| offset pagination | pagination helper |
| validation | Zod middleware |
| consistent errors | `GeneralResponse.js` + validation middleware |
| assign/unassign | task assignment routes |
| same-org assignee | `assignmentHelper.js` |
| project dashboard | `/projects/:id/dashboard` |
| bulk status | `/tasks/bulk/status` |
| async email | BullMQ worker |
| enqueue before success | `taskService.assignTask()` |
| enqueue failure consistency | compensating delete strategy |
| 3 retries / 1s,2s,4s | BullMQ attempts=4 + exponential 1s |
| DLQ | `task-email-dlq` |
| `/jobs/:id` | jobs route/service |
| global 50 emails/min | worker limiter |
| unit tests | `tests/unit` |
| integration tests | `tests/integration` |
| clean test state | dedicated test DB reset before each test |
| Swagger | `/docs` |
| Postman | `postman/TaskFlow.postman_collection.json` |
| coverage | `npm run test:coverage` |
| queue job test | integration assignment test |
