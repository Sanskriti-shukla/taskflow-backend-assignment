# How to Explain This Project in the Interview

## 1. Why this structure?

Say:

> I used the same layered Express structure I normally work with: routes only define endpoints and middleware, controllers handle request/response, services contain business rules, repositories contain Sequelize queries, and models define database entities.

Flow:

```text
Route -> Controller -> Service -> Repository -> Model
```

## 2. How is multi-tenancy protected?

The important point is that protected APIs do not accept/trust an organization ID from the client.

At login, organization membership is checked. The access token contains organization context. JWT middleware verifies the token and checks the membership again from PostgreSQL.

Then repositories always query using that organization context.

For tasks, tenant validation happens through the task's project:

```text
Task -> Project -> organizationId
```

If the project belongs to another organization, the query does not return the resource and the API sends 403.

## 3. Why refresh tokens in DB?

JWT access tokens are short-lived and stateless. Refresh tokens live longer, so I store their SHA-256 hashes in PostgreSQL. That allows logout/revocation.

On refresh I rotate the token:

```text
verify token -> find DB record -> revoke old -> issue new pair
```

## 4. Why bcrypt cost 12?

The assignment requires bcrypt cost >= 12. Password hashes are never stored as plain text.

## 5. How task assignment + email works

```text
API assignment request
  -> validate tenant
  -> validate same-org user
  -> save assignment
  -> enqueue BullMQ job
  -> return job ID

Worker
  -> gets job from Redis
  -> sends mock email
  -> retries on failure
```

The API does not send email directly, so the request does not wait for the email provider.

## 6. What if queue insertion fails?

I used a compensation strategy because it is simple and clear for this assignment.

If assignment insert succeeds but BullMQ enqueue fails, the new assignment is deleted and the API returns 503. So I do not return a successful assignment that has no email job.

For a larger production system I would consider a transactional outbox for stronger distributed consistency.

## 7. Why Sequelize?

It is familiar, keeps model definitions readable, supports PostgreSQL associations/transactions, and still allows raw PostgreSQL where needed, such as the full-text search vector/index.

## 8. Why migrations instead of sync()?

The assignment explicitly requires migration files. `sequelize.sync()` is not used to create production schema.

The migration records:

- tables
- foreign keys
- CASCADE / RESTRICT rules
- PostgreSQL enums
- indexes
- full-text search vector/index

It also has a down/revert path.

## 9. Explain indexes simply

- `org_members(user_id, organization_id)`: checked on every authenticated request.
- `projects(organization_id, created_at)`: tenant project listing.
- `tasks(project_id, status)`: dashboard/status filter.
- `tasks(project_id, priority)`: task priority filter.
- `tasks(due_date)`: due-date range.
- `task_assignments(user_id, task_id)`: assignee filtering.
- GIN `search_vector`: fast PostgreSQL full-text search.

## 10. Explain soft delete

Projects and tasks use Sequelize `paranoid: true`. Delete sets `deleted_at` instead of physically removing the row.

Normal Sequelize queries automatically ignore soft-deleted rows.

## 11. What should you demo?

Demo these because they show the main evaluation points:

1. Login as Alice / Acme.
2. List projects.
3. Create a task.
4. Filter tasks.
5. Assign Bob.
6. Show worker log.
7. Check `/jobs/:id`.
8. Login to Globex or use a Globex ID with Alice and show 403.
9. Show migration indexes/enums.
10. Run tests.
