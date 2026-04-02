# Agent Guidelines for ai_form

This document provides guidelines for agents working on this codebase.

## Project Overview

- **Framework**: Next.js 16.2.1 with React 19.2.4
- **Language**: TypeScript
- **Styling**: MUI (Material-UI) + Tailwind CSS 4
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod validation
- **Testing**: Vitest
- **Package Manager**: npm

## Build/Lint/Test Commands

### Development
```bash
npm run dev        # Start development server
```

### Building
```bash
npm run build      # Production build
npm run start      # Start production server
```

### Linting
```bash
npm run lint       # Run ESLint
```

### Testing
```bash
npm run test       # Run all tests (Vitest)
```

#### Running a Single Test

To run a single test file, use the Vitest CLI directly:

```bash
npx vitest run modules/form-builder/dnd/paletteDragLogic.test.ts
```

Or use the `test` command with a filter:

```bash
npx vitest run --filter "paletteDragLogic"
```

For watch mode during development:

```bash
npx vitest modules/form-builder/dnd/paletteDragLogic.test.ts
```

## Code Style Guidelines

### Import Conventions

1. **Group imports** in this order:
   - External libraries (React, Next.js, MUI, etc.)
   - Internal modules (@/modules/*)
   - Shared utilities (@/shared/*)
   - Config/constants (@/config/*, @/constants/*)
   - Component imports

2. **Use path aliases**: Always use `@/` for absolute imports from project root

3. **Named imports preferred**:
   ```typescript
   import Box from "@mui/material/Box";        // Default for components
   import { useState, useCallback } from "react";  // Named for hooks
   import { DndContext, type DragEndEvent } from "@dnd-kit/core";  // Types inline
   ```

### Formatting

1. **Use 2-space indentation**
2. **Max line length**: 2000 characters (enforced by tooling)
3. **Use semicolons**: Yes
4. **Use single quotes** for strings unless containing apostrophes
5. **Trailing commas**: Yes, for multiline arrays and objects

### TypeScript

1. **Always define return types** for functions, especially exported ones
2. **Use explicit types** for function parameters
3. **Use `type` for object shapes, interfaces for extensible types**
4. **Use `import type` / `export type`** for type-only exports
5. **Use `typeof` pattern** for inferring types from values:
   ```typescript
   const form = useFormsStore((s) => s.getFormById(formId));
   // Type is inferred automatically
   ```

### Naming Conventions

1. **Components**: PascalCase (e.g., `FormBuilderPage`, `QuestionCard`)
2. **Files**: PascalCase for components/pages, camelCase for utilities
3. **Variables**: camelCase
4. **Constants**: UPPER_SNAKE_CASE for config values, camelCase for others
5. **Hooks**: camelCase with `use` prefix (e.g., `useDndSensors`)
6. **Store slices**: camelCase (e.g., `formsStore`, `useFormsStore`)

### React/Next.js Patterns

1. **Use `"use client"`** directive for client-side components
2. **Use `React.useMemo` / `React.useCallback`** instead of `useMemo` / `useCallback` imports to avoid conflicts
3. **Use `React.ReactNode` / `React.FC`** for typing children and components
4. **Prefer function components** over class components
5. **Use `next/navigation` hooks** (`useParams`, `useRouter`, `usePathname`) instead of `next/router`
6. **Extract client logic** to separate components, keep pages server-compatible when possible

### MUI (Material-UI) Patterns

1. **Use `sx` prop** for one-off custom styles
2. **Use system props** for responsive design (e.g., `sx={{ display: { xs: 'none', md: 'block' } }}`)
3. **Use `component={motion.div}`** for Framer Motion integration with MUI
4. **Import specific components** to reduce bundle size:
   ```typescript
   import Button from "@mui/material/Button";
   import Box from "@mui/material/Box";
   ```

### State Management (Zustand)

1. **Define store in a dedicated file** (e.g., `formsStore.ts`)
2. **Use `create<StoreName>()`** pattern with type inference
3. **Prefer selectors** to avoid unnecessary re-renders:
   ```typescript
   const form = useFormsStore((s) => s.getFormById(formId));
   ```
4. **Use `useCallback`** for store actions when passing to child components

### Form Handling (React Hook Form + Zod)

1. **Define Zod schemas first** for form validation:
   ```typescript
   import { z } from "zod";

   const formSchema = z.object({
     title: z.string().min(1, "Title is required"),
     description: z.string().optional(),
     fields: z.array(fieldSchema).min(1, "At least one field is required"),
   });
   ```

2. **Use `useForm`** with Zod resolver:
   ```typescript
   import { useForm } from "react-hook-form";
   import { zodResolver } from "@hookform/resolvers/zod";
   import type { z } from "zod";

   const form = useForm<z.infer<typeof formSchema>>({
     resolver: zodResolver(formSchema),
     defaultValues: { title: "", description: "", fields: [] },
   });
   ```

3. **Register fields** with `register` or Controller for complex components:
   ```typescript
   // Simple fields
   <input {...register("title")} />
   
   // Complex MUI components with Controller
   import { Controller } from "react-hook-form";
   <Controller
     name="fieldType"
     control={form.control}
     render={({ field }) => <Select {...field} />}
   />
   ```

4. **Handle form submission**:
   ```typescript
   const onSubmit = form.handleSubmit(async (data) => {
     // Submit logic here
   });
   ```

5. **Display validation errors** using `form.formState.errors`:
   ```typescript
   <FormHelperText error>
     {form.formState.errors.title?.message}
   </FormHelperText>
   ```

### Error Handling

1. **Use toast notifications** for user-facing errors:
   ```typescript
   import { notifyWarning, notifyError } from "@/shared/utils/toastNotify";
   notifyWarning("Drop the field onto the canvas to add it.");
   ```
2. **Return null or early guard clauses** for component-level errors
3. **Use type guards** for runtime type checking when needed

### Testing Patterns

1. **Test file naming**: `*.test.ts` or `*.test.tsx` colocated with source
2. **Use Vitest** with `describe`, `it`, `expect` syntax
3. **Keep tests focused** on single functionality
4. **Use realistic test data** that matches production types

### Project Structure

```
app/                    # Next.js App Router pages
  api/                  # API routes
  forms/[formId]/      # Dynamic form routes
  layout.tsx           # Root layout
  providers.tsx        # Client providers (Theme, Router)

modules/                # Feature modules
  form-builder/        # Form builder feature
  form-dashboard/      # Dashboard feature
  form-responses/      # Responses feature

shared/                # Shared code
  types/               # TypeScript types
  utils/               # Utility functions
  components/          # Shared components

config/                # Configuration
  mui-theme.ts         # MUI theme

constants/             # App constants
```

### Tailwind CSS

1. **Use Tailwind 4** syntax
2. **Combine with MUI** using Tailwind for utility classes and MUI for components
3. **Use arbitrary values** sparingly (e.g., `className="bg-accent-50"`)

### Animations

1. **Use Framer Motion** for complex animations
2. **Use `motion.div`** with MUI `component` prop:
   ```tsx
   <Box component={motion.div} initial={false} animate={{ ... }}>
   ```

### ESLint Configuration

The project uses `eslint-config-next` with TypeScript support. Run `npm run lint` before committing.

---

## Important Notes

### This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
