# TaskFlow Submission Checklist

Before submitting:

- [ ] Run `docker compose up --build` successfully.
- [ ] Verify `http://localhost:3000/health` returns `{ "status": "ok" }`.
- [ ] Open Swagger at `http://localhost:3000/docs`.
- [ ] Login with `alice@taskflow.test`, `Password123!`, organization slug `acme`.
- [ ] Demonstrate project CRUD.
- [ ] Demonstrate task CRUD and filters.
- [ ] Demonstrate task assignment and capture the returned job ID.
- [ ] Check `GET /jobs/:id`.
- [ ] Show worker logs processing the notification asynchronously.
- [ ] Demonstrate cross-tenant access returning HTTP 403.
- [ ] Demonstrate a member cannot delete a project.
- [ ] Run `docker compose exec api npm test`.
- [ ] Import and run the Postman collection.
- [ ] Read `docs/HOW_TO_EXPLAIN.md` and understand the main implementation decisions.
- [ ] Replace local/demo secrets before deploying anywhere outside local development.
- [ ] Do not commit `.env`.
- [ ] Commit the generated `package-lock.json` after running `npm install`/Docker build locally.
- [ ] Push the repository publicly to GitHub.
- [ ] Record the demo using `docs/DEMO_SCRIPT.md`.
- [ ] Verify GitHub, video, and any shared links are publicly accessible.
