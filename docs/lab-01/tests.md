# Lab 1 — Test Plan and Evidence

All test files live under server/tests/lab-01/ and client/tests/lab-01/.

| # | Tool | Test | Result |
|---|------|------|--------|
| 1 | Supertest | GET /api/health returns 200, status=ok | Pass |
| 2 | Supertest | GET /api/categories returns 4 seeded categories in id order | Pass |
| 3 | Vitest | Heading renders | Pass |
| 4 | Vitest | Success state shows Online + category list | Pass |
| 5 | Vitest | Error state shows Offline + message | Pass |

### Supertest Terminal Output (Backend Tests):
```text
 RUN  v2.1.9 C:/Users/PC'M/Downloads/Lab1_Starter_Scaffold/toktickit/server

 ✓ tests/lab-01/health.test.ts (1 test) 16ms
 ✓ tests/lab-01/categories.test.ts (1 test) 122ms

 Test Files  2 passed (2)
      Tests  2 passed (2)
   Duration  10.17s
```

### Vitest Terminal Output (Frontend Tests):
```text
 RUN  v2.1.9 C:/Users/PC'M/Downloads/Lab1_Starter_Scaffold/toktickit/client

 ✓ tests/lab-01/App.test.tsx (3 tests) 221ms
   ✓ renders the TokTickIT heading
   ✓ shows Online and the seeded categories on success
   ✓ shows an Offline error message when the API is unavailable

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Duration  11.51s
```
