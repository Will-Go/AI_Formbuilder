# Agent Guidelines for ai_form

This document provides guidelines for agents working on this monorepo.

## Project Structure

```
ai_form/
├── client/           # Next.js frontend (main workspace)
├── database/         # Supabase/PostgreSQL schema & migrations
└── server/           # (reserved for future backend services)
```

## Development Commands

```bash
cd client

npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint
```

## Tech Stack

- **Frontend**: Next.js 16.2.1, React 19.2.4, TypeScript
- **Styling**: MUI (Material-UI) + Tailwind CSS 4
- **State**: Zustand
- **Forms**: React Hook Form + Zod
- **Database**: Supabase (PostgreSQL)

## Code Style (from client/AGENTS.md)

- **Imports**: Group by External → Internal → Shared → Config → Components
- **Path aliases**: Use `@/` for absolute imports from project root
- **Formatting**: 2-space indent, single quotes, trailing commas, semicolons
- **Types**: Define return types, use explicit params, prefer `type` over `interface`
- **Naming**: PascalCase components, camelCase utilities, UPPER_SNAKE constants
- **React**: Use `"use client"`, prefer `React.useMemo`/`useCallback`
- **MUI**: Use `sx` prop, import specific components
- **Zustand**: Use selectors, `useCallback` for store actions

## Error Handling

- Use toast notifications for user-facing errors
- Return null or early guard clauses for component errors

## Loading States

- Always add loading states to improve perceived performance and user experience
- Use MUI `Skeleton` components for content-heavy UI (cards, lists, tables)
- If the UI is too complex for Skeletons, use MUI `CircularProgress` component
- Import from `@mui/material` (e.g., `import { Skeleton, CircularProgress } from "@mui/material"`)

## Database

Database schema and migrations are in `database/` directory. Supabase hooks are in `database/supabase/hooks/`.

## Custom React Query Hooks: `useAppQuery` & `useAppMutation`

This section explains the custom hooks `useAppQuery` and `useAppMutation` that wrap TanStack Query's core hooks with built-in toast notifications and additional utilities.

### apiRequest Pattern

The `apiRequest` utility (`@/shared/utils/apiRequest`) is the standard way to make HTTP requests. It wraps axios with automatic error handling and is designed to work with `useAppQuery` and `useAppMutation`.

```typescript
import { apiRequest } from "@/shared/utils/apiRequest";

const result = await apiRequest<MyResponse>({
  method: "get",
  url: "/users",
  data: { name: "John" },
  params: { page: 1 },
});
```

### Common Options

Both hooks accept notification options:

| Property                   | Type                          | Description                                   |
| -------------------------- | ----------------------------- | --------------------------------------------- |
| `successMsg`               | `string \| (data) => string`  | Success toast message                         |
| `errorMsg`                 | `string \| (error) => string` | Custom error toast message                    |
| `translateKey`             | `string`                      | i18n namespace for error translations         |
| `showTranslatedErrorToast` | `boolean`                     | Show translated error toast (default: `true`) |
| `showErrorToast`           | `boolean`                     | Show custom error toast (default: `true`)     |

### useAppQuery

Wrapper around TanStack Query's `useQuery` with automatic toasts and an `invalidate` helper.

```typescript
import { useAppQuery } from "@/shared/hooks/useAppQuery";
import { apiRequest } from "@/shared/utils/apiRequest";

const query = useAppQuery({
  queryKey: ["users"],
  queryFn: () => apiRequest({ method: "get", url: "/users" }),
  successMsg: "Users loaded",
});

// Returns query.data, query.isLoading, query.isError + invalidate()
query.invalidate(); // Refetch the query
```

### useAppMutation

Wrapper around TanStack Query's `useMutation` with automatic toasts.

```typescript
import { useAppMutation } from "@/shared/hooks/useAppMutation";
import { apiRequest } from "@/shared/utils/apiRequest";

const mutation = useAppMutation({
  mutationFn: (data) => apiRequest({ method: "post", url: "/users", data }),
  successMsg: "User created!",
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
});

mutation.mutate(newUser);
```

### Best Practices

1. Use `apiRequest` for all HTTP requests
2. Use `successMsg` for user feedback
3. Use `translateKey` for i18n error messages
4. Use `invalidate()` to refetch after mutations

## API Architecture Pattern

This project uses a layered API architecture for all CRUD and endpoint work:
**Route -> Zod schema -> feature DAO -> database function**.

### Flow

```
Frontend (useAppQuery/useAppMutation)
    ↓ apiRequest
API Route (route.ts)
    ↓ validates request with Zod schema
Schema (shared/schemas/)
    ↓ calls
Feature DAO (shared/daos/formsDao.ts, questionsDao.ts, etc.)
    ↓ calls Supabase RPC
Database Function (database/functions/<feature>/R__*.sql)
```

### Layers

1. **API Routes** (`app/api/`)
   - Handle HTTP methods (GET, POST, PATCH, DELETE)
   - Authentication via `withAuth` wrapper
   - Validate query params and request bodies with Zod before calling the DAO
   - Return JSON responses
   - Keep route logic thin; do not put database business logic in routes

2. **Zod Schemas** (`shared/schemas/`)
   - Define what each endpoint accepts before data reaches the database
   - Use `safeParse` in routes and return `400` for invalid payloads
   - Export inferred TypeScript types for DAO inputs

3. **Feature DAOs** (`shared/daos/`)
   - Named after the feature being developed, for example `formsDao.ts` or `questionsDao.ts`
   - Call Supabase RPC functions
   - Return typed data to routes
   - Named with `*Dao.ts` suffix
   - Translate database/RPC errors into route-friendly errors when needed

4. **Database Functions** (`database/functions/`)
   - Put CRUD and endpoint business logic in SQL functions grouped by feature folder
   - Use Supabase RPC from DAOs instead of direct table writes for endpoint workflows
   - Enforce ownership, authorization-sensitive checks, ordering, and multi-step writes atomically

### Example: Forms API

```typescript
// 1. API Route handles HTTP
// app/api/form/route.ts
export const GET = withAuth(async (request: Request) => {
  const parsed = GetFormsSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const result = await getForms({ ownerId: user.id, search, limit, pageNumber });
  return NextResponse.json({ forms: result.forms, pagination: result.pagination });
});

// 2. Feature DAO calls the database function
// shared/daos/formsDao.ts
export async function getForms(options: GetFormsOptions): Promise<FormsDaoResult> {
  const { data } = await supabase.rpc("get_forms", { p_limit, p_page_number, ... });
  return { forms: data.forms.map(mapRpcFormToForm), pagination: data.pagination };
}
```

### Best Practices

1. For CRUD/endpoints, follow Route -> Zod schema -> feature DAO -> database function
2. Put business rules and multi-step writes in database functions, not routes
3. Use DAOs as the only route-facing data access layer
4. Always authenticate routes with `withAuth`
5. Validate input in routes (query params, body) using Zod schemas
6. Return typed responses from DAOs and validate RPC payloads when useful

### Input Validation with Zod

Always validate request body and query params using Zod schemas in routes:

```typescript
// shared/schemas/formDetails.ts
import { z } from "zod";

export const CreateFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  sourceFormId: z.string().uuid().optional(),
});

// In route.ts
export const POST = withAuth(async (request: Request) => {
  const body = await request.json();
  const validated = CreateFormSchema.parse(body); // Throws if invalid
  // Use validated data...
});
```

Zod schemas are defined in `shared/schemas/` and should be used for both input validation and response validation.

## Important Notes

- This is NOT the Next.js you know - check breaking changes in `node_modules/next/dist/docs/`
- Run `npm run lint` before committing
- For detailed guidelines, see `client/AGENTS.md`
