# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```sh
npm run dev          # Start dev server on localhost:8080
npm run build        # Production build (vite build)
npm run build:dev    # Development mode build
npm run lint         # ESLint
npm run preview      # Preview production build
```

No test runner is configured. Database migrations are in `supabase/migrations/` and applied with `supabase db push`.

## Architecture

**TaskLink** is a collaborative Kanban project manager — a React 18 + TypeScript SPA backed by Supabase (Postgres, Auth, Realtime, RLS).

### Data flow

1. **Supabase client** (`src/integrations/supabase/client.ts`) — single shared instance, auth persisted to localStorage
2. **Database layer** (`src/lib/database.ts` + `src/lib/database/*.ts`) — all Supabase queries live here, no direct DB calls in components
3. **Custom hooks** (`src/hooks/`) — bridge between DB layer and UI; `useBoard` is the central hook managing boards/columns/tasks/dependencies state
4. **Components** consume hooks and render UI

### Key patterns

- **Path alias**: `@/*` maps to `src/*` (configured in vite.config.ts and tsconfig)
- **UI components**: shadcn/ui primitives live in `src/components/ui/` — these are generated, don't hand-edit
- **Forms**: react-hook-form + Zod schemas for validation (see `CreateTaskModal`, `Auth` page)
- **Drag & drop**: `@hello-pangea/dnd` — `KanbanBoard` is the `DragDropContext`, `KanbanColumn` is `Droppable`, `TaskCard` is `Draggable`
- **Auth gating**: `ProtectedRoute` and `PublicRoute` wrappers in `App.tsx` handle redirects
- **Realtime**: `useNotifications` subscribes to Supabase realtime channels for live notification updates
- **Styling**: Tailwind CSS with CSS-variable-based theme tokens (light/dark via class strategy); `cn()` from `src/lib/utils.ts` for merging classes

### Role-based access

Supabase RLS enforces four roles: `viewer < editor < admin < owner`. Key DB functions: `has_board_access()`, `can_edit_board()`, `can_manage_board()`. The frontend checks roles via `useBoardMembers` to conditionally render edit/admin controls.

### Database

Three migrations define the schema (`supabase/migrations/`):
1. Core tables: profiles, boards, columns, tasks, task_dependencies
2. Comments & notifications with triggers
3. Board members, invites, team collaboration, RLS policies

Auto-generated Supabase types are in `src/integrations/supabase/types.ts` — regenerate with `supabase gen types typescript`.

## Environment Variables

Required in `.env` at project root (prefixed `VITE_` for Vite exposure):
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
