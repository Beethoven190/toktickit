# Lab 1 — Test Plan and Evidence

All test files live under server/tests/lab-01/ and client/tests/lab-01/.

| # | Tool | Test | Result |
|---|------|------|--------|
| 1 | Supertest | GET /api/health returns 200, status=ok | Pass |
| 2 | Supertest | GET /api/categories returns 4 seeded categories in id order | Todo (Issue 4) |
| 3 | Vitest | Heading renders | Pass |
| 4 | Vitest | Success state shows Online + category list | Todo (Issue 4) |
| 5 | Vitest | Error state shows Offline + message | Todo (Issue 4) |

### Supertest Terminal Output (Health Endpoint):
```text
 ✓ tests/lab-01/health.test.ts (1)
   ✓ GET /api/health (1)
     ✓ returns 200 with status ok and the service name

 Test Files  1 passed (1)
      Tests  1 passed | 1 todo (2)
```

### Vitest Terminal Output (Client Heading):
```text
 ✓ tests/lab-01/App.test.tsx (1)
   ✓ App (1)
     ✓ renders the TokTickIT heading

 Test Files  1 passed (1)
      Tests  1 passed | 2 todo (3)
```
