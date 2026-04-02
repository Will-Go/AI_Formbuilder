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
npm run test         # Run all tests (Vitest)
```

### Running a Single Test

```bash
npx vitest run path/to/test.test.ts
npx vitest run --filter "test-name"
```

## Tech Stack

- **Frontend**: Next.js 16.2.1, React 19.2.4, TypeScript
- **Styling**: MUI (Material-UI) + Tailwind CSS 4
- **State**: Zustand
- **Forms**: React Hook Form + Zod
- **Testing**: Vitest
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
- **Testing**: Colocate tests, use Vitest with `describe`/`it`/`expect`

## Error Handling

- Use toast notifications for user-facing errors
- Return null or early guard clauses for component errors

## Database

Database schema and migrations are in `database/` directory. Supabase hooks are in `database/supabase/hooks/`.

## Important Notes

- This is NOT the Next.js you know - check breaking changes in `node_modules/next/dist/docs/`
- Run `npm run lint` before committing
- For detailed guidelines, see `client/AGENTS.md`