# Lab 1 — AI Use and Reflection

**LLM/agent used:** Antigravity (Gemini 3.5 Flash / Gemini 3.6 Flash)

## Selected key prompts (6–10)
| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | Check if the project is a Git repository, initialize and point to remote repository `https://github.com/Beethoven190/toktickit.git` | Checked the workspace, ran `git init`, set remote, and aligned local main branch with remote origin/main. |
| 2 | Create `lab1-staging` and push it, then create `feature/1-project-foundation` | Configured branch structure as required by Git Flow, and pushed to GitHub. |
| 3 | Install client and server dependencies, check database connection using Prisma | Ran `npm install` in both packages and verified database connectivity. |
| 4 | Write README.md documentation with setup instructions | Created comprehensive guides for running client and server apps. |
| 5 | Implement `GET /api/health` in Express server and verify with Supertest | Added route returning HTTP 200 `{ status: "ok", service: "TokTickIT API" }`, and test passed successfully. |
| 6 | Integrate frontend health check in `client/src/api.ts` and `client/src/App.tsx` | Handled loading, success (Online), and error (Offline) state rendering. |
| 7 | Create Prisma Category model, run migration, and write idempotent seed script | Defined schema, generated migration, and seeded 4 categories using upsert. |
| 8 | Implement `GET /api/categories` in Express backend with Prisma and Supertest | Added route returning categories array in ID order, and verified with passing Supertest test. |
| 9 | Integrate category fetching into React client and write Vitest component tests | Connected `checkSystem()` to fetch real categories from DB and asserted rendering with Vitest. |
| 10 | Update test plan, peer review records, and AI usage documentation | Recorded all passing test terminal evidence and verified GitHub peer review comments. |

## Reflection
Working with the Antigravity AI coding agent greatly accelerated the full-stack development workflow, from configuring Git Flow branch targets to executing automated Supertest and Vitest test suites. Using precise, scoped prompts for each individual issue ensured that features were implemented strictly according to acceptance criteria without polluting other branches. Waiting for peer reviews between issues also helped catch any potential branch target mistakes before merging into `lab1-staging`.
