# SaaS Form Builder (Google Forms-style) — Plan

## Summary

Build a production-ready, modular Next.js (App Router) form builder inspired by Google Forms, focusing on **Form Dashboard** and **Form Builder** UI/UX (per provided screenshots). Data persistence uses **local-first storage (Zustand + localStorage)** with no authentication. Preview + basic responses are included to support end-to-end submission.

## Current State Analysis (Repo Facts)

- Project is a fresh Next.js App Router template with Tailwind v4 import in [globals.css](file:///Users/wgongw/Documents/Projects/AI_Form/app/globals.css).
- Dependencies currently include only `next@16.2.1`, `react@19.2.4`, `react-dom@19.2.4` in [package.json](file:///Users/wgongw/Documents/Projects/AI_Form/package.json).
- No existing `modules/`, `shared/`, `constants/`, `daos/`, or app routes beyond the starter home page.
- Next.js local docs exist at `node_modules/next/dist/docs/` (note: CSS-in-JS requires App Router-compatible setup).

## Goals & Success Criteria

- **Dashboard**
  - Create a form, list forms as cards, edit title/metadata, delete form.
  - Cards show: title, created date, last updated, response count.
  - Layout mirrors Google Forms dashboard (templates row + recent list/grid).
- **Builder**
  - Google Forms-like layout: left field palette, center canvas with question cards, right configuration panel, top bar actions (title, preview, save/autosave, publish/share).
  - Add questions, reorder via drag & drop, duplicate/delete, required toggle.
  - Support listed question types (see “Question Types”).
- **Preview**
  - Non-editable view; can submit; shows validation errors.
- **Responses (Minimal but functional)**
  - Store submissions per form; list submissions; export JSON.

## Key Assumptions (Can Be Adjusted Later)

- Storage is local-first (Zustand persist to `localStorage`) instead of Supabase.
- “Publish/share” generates a shareable link to `/{formId}/preview` without access control.
- Initial scope prioritizes visual parity and core behaviors; analytics/themes/conditional logic are implemented minimally (foundation + basic functionality), not a full BI system.

## Proposed Architecture (Flattened Structure)

Create the requested top-level folders:

- `app/` routes + layouts
- `config/` theme/config utilities
- `constants/` question type registry, defaults
- `shared/` shared components/hooks/utils/types
- `modules/`
  - `form-dashboard/` dashboard UI + components
  - `form-builder/` builder UI + components + editor logic
  - `form-responses/` responses UI + components
- `daos/` local storage DAOs and (future) backend adapters

## Data Model & Validation

- Define strict TypeScript types mirroring the provided model (with small practical additions):
  - `Form`, `Question`, `Response`, `Answer`, plus:
    - `QuestionType` union
    - `QuestionSettings` per type (options, scale bounds, etc.)
    - `ConditionalLogic` minimal: show/hide based on a single dependency
    - `ThemeConfig` minimal: primary color + background style
- Zod schemas:
  - Form schema for persistence validation.
  - Dynamic response schema generation from form questions for preview submission validation.

## State Management (Zustand)

- `formsStore`: CRUD for forms + questions; tracks `updatedAt`, reorders, autosave.
- `responsesStore`: submissions keyed by `formId`; supports export to JSON.
- Persistence:
  - Use Zustand `persist` middleware to `localStorage`.
  - Add lightweight migration/versioning for forward-compatible schema changes.

## UI/UX Implementation Plan (Step-by-Step)

### Step 1 — Project Setup & UI Foundations

**Changes**
- Install dependencies:
  - UI: `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`
  - State: `zustand`
  - Forms: `react-hook-form`, `zod`, `@hookform/resolvers`
  - DnD: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- Add an App Router-compatible MUI setup:
  - `app/providers.tsx` (client): ThemeProvider, CssBaseline, Emotion cache wrapper (following MUI App Router guidance).
  - Update `app/layout.tsx` to wrap `children` in providers.
- Establish base styling tokens:
  - Google Forms-like purple accent, spacing, surface backgrounds via MUI theme.

**Files**
- `config/mui-theme.ts`
- `app/providers.tsx`
- Update `app/layout.tsx`

### Step 2 — Types, Constants, and DAOs

**Changes**
- Implement the domain model and type registries:
  - Question type definitions, labels, icons, defaults.
- Create local persistence helpers:
  - `formsDao` + `responsesDao` to encapsulate serialization and migrations.

**Files**
- `shared/types/forms.ts`
- `shared/types/responses.ts`
- `constants/question-types.ts`
- `constants/defaults.ts`
- `daos/formsDao.ts`
- `daos/responsesDao.ts`
- `shared/utils/id.ts`
- `shared/utils/datetime.ts`

### Step 3 — Stores (Autosave + Migrations)

**Changes**
- Build Zustand stores on top of DAOs:
  - `createForm`, `updateFormMeta`, `addQuestion`, `updateQuestion`, `deleteQuestion`, `reorderQuestions`, `duplicateQuestion`, `deleteForm`.
  - `submitResponse`, `listResponses`, `exportResponsesJson`.
- Add autosave behavior:
  - Writes are persisted automatically; builder UI uses debounced updates for text fields.

**Files**
- `shared/hooks/useDebouncedValue.ts`
- `modules/form-dashboard/store/formsStore.ts`
- `modules/form-responses/store/responsesStore.ts`

### Step 4 — App Routes & Navigation Skeleton

**Changes**
- Replace starter home page with redirect/entry into dashboard.
- Add route groups for app shell vs preview:
  - `/forms` dashboard
  - `/forms/[formId]/edit` builder
  - `/forms/[formId]/preview` preview + submission
  - `/forms/[formId]/responses` responses

**Files**
- Update `app/page.tsx`
- `app/forms/page.tsx`
- `app/forms/[formId]/edit/page.tsx`
- `app/forms/[formId]/preview/page.tsx`
- `app/forms/[formId]/responses/page.tsx`
- `app/api/health/route.ts` (simple route handler to validate API plumbing)

### Step 5 — Form Dashboard (Google Forms-like)

**Changes**
- Implement dashboard layout:
  - Top bar: hamburger, “Forms”, search, grid icon, user avatar placeholder.
  - Templates row: “Blank” and a few sample templates (local JSON seeds).
  - Recent forms grid: cards with title, updated date, response count, overflow menu (rename, duplicate, delete).
- Create form action flows:
  - “Blank” creates a form and navigates to builder.

**Files**
- `modules/form-dashboard/components/DashboardTopBar.tsx`
- `modules/form-dashboard/components/TemplatesRow.tsx`
- `modules/form-dashboard/components/FormCard.tsx`
- `modules/form-dashboard/components/FormGrid.tsx`
- `modules/form-dashboard/pages/FormDashboardPage.tsx`

### Step 6 — Builder Layout (Top Bar + 3 Panels)

**Changes**
- Builder shell mirroring screenshot:
  - Top bar: form title, tabs (Questions/Responses/Settings), preview button, share/publish button.
  - Center: header card (title + description) + question list.
  - Left: field palette with draggable items.
  - Right: configuration panel for selected question.
  - Floating vertical action strip on right of canvas (add question, import image, add title/description, etc. — implemented minimally).

**Files**
- `modules/form-builder/pages/FormBuilderPage.tsx`
- `modules/form-builder/components/BuilderTopBar.tsx`
- `modules/form-builder/components/FieldPalette.tsx`
- `modules/form-builder/components/Canvas.tsx`
- `modules/form-builder/components/QuestionCard.tsx`
- `modules/form-builder/components/QuestionConfigPanel.tsx`
- `modules/form-builder/components/FormHeaderCard.tsx`

### Step 7 — Drag & Drop (dnd-kit)

**Changes**
- Reordering questions in the canvas (sortable).
- Adding new questions by clicking palette items (and optionally drag-from-palette to canvas as a follow-up).
- Maintain `order` consistently and persist updates.

**Files**
- `modules/form-builder/dnd/sortable.ts`
- Update `Canvas.tsx` / `QuestionCard.tsx`

### Step 8 — Question Types (All Listed)

Implement render + config controls per question type using a registry approach:

- Text: short, long
- Selection: multiple choice, checkbox, dropdown
- Structured: email, phone, number, date
- Advanced: rating, linear scale, yes/no
- Layout: section divider, paragraph

**Implementation**
- Each type provides:
  - default settings
  - builder display renderer
  - preview input renderer
  - config form schema (partial) and UI controls

**Files**
- `modules/form-builder/question-types/registry.ts`
- `modules/form-builder/question-types/*/*.tsx`

### Step 9 — Preview & Submission (React Hook Form + Zod)

**Changes**
- Preview page:
  - Renders form using question registry.
  - Generates Zod schema from questions and validates on submit.
  - On success, saves response in `responsesStore`.
- Shows per-field errors consistent with question validation rules.

**Files**
- `modules/form-builder/preview/FormPreviewPage.tsx`
- `modules/form-builder/preview/buildResponseSchema.ts`

### Step 10 — Responses UI + JSON Export

**Changes**
- Responses page:
  - Summary (count, last submitted)
  - Table/list of submissions
  - Export JSON (downloads file client-side)

**Files**
- `modules/form-responses/pages/FormResponsesPage.tsx`
- `modules/form-responses/components/ResponsesTable.tsx`
- `shared/utils/downloadJson.ts`

### Step 11 — Extras (Minimal Implementations)

- Conditional logic (minimal): “show this question if previous answer equals X”.
- Themes (minimal): per-form theme primary color + background choice.
- Analytics (minimal): response count + simple completion rate placeholder.

These will be implemented only after core dashboard/builder/preview are working.

## Verification Plan

- Run `npm run lint` and `npm run build`.
- Manual flows:
  - Create form → edit title/description → add multiple question types → reorder → preview → submit → responses list updates.
  - Refresh browser → data persists.
  - Delete form → disappears from dashboard and removes related responses (or flags them as orphaned, per DAO decision).
- Visual checks:
  - Dashboard resembles Google Forms layout.
  - Builder layout matches screenshot structure (top bar + tabs + centered cards + right action strip).

## Rollout / Future Backend (Supabase)

- DAO boundary keeps storage swappable:
  - Later replace `formsDao`/`responsesDao` with Supabase tables + RLS once auth is added.
  - Keep UI and stores stable; only persistence layer changes.

