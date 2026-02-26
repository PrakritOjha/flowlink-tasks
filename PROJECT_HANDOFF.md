# TaskLink - Complete Project Handoff Document

> This document is the single source of truth for anyone (human or AI) picking up this project. It covers everything: what the app does, how it's built, every file, every pattern, every database table, and how all the pieces connect.

---

## Table of Contents

1. [What Is TaskLink](#1-what-is-tasklink)
2. [Quick Start](#2-quick-start)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [Architecture Overview](#5-architecture-overview)
6. [Data Flow](#6-data-flow)
7. [Database Schema](#7-database-schema)
8. [Authentication](#8-authentication)
9. [Role-Based Access Control](#9-role-based-access-control)
10. [Frontend: Pages & Routing](#10-frontend-pages--routing)
11. [Frontend: Components](#11-frontend-components)
12. [Hooks & State Management](#12-hooks--state-management)
13. [Feature Deep Dives](#13-feature-deep-dives)
14. [Configuration Files](#14-configuration-files)
15. [Styling System](#15-styling-system)
16. [Key Patterns & Conventions](#16-key-patterns--conventions)
17. [Known Limitations & Future Work](#17-known-limitations--future-work)
18. [Credits](#18-credits)

---

## 1. What Is TaskLink

**TaskLink** is a web-based collaborative Kanban project manager built for small teams, especially student teams.

**The problem it solves:** Student teams lose track of who's doing what, can't see progress, don't know which tasks are blocking others, and miss deadlines silently. TaskLink sits between Trello (too simple, no dependencies) and Jira (overkill for small teams).

### Core Features

- **Kanban boards** with drag-and-drop (columns: To Do, In Progress, Done)
- **Task CRUD** with metadata: title, description, assignee, due date, category/icon
- **Task dependencies** with blocked/unblocked status tracking
- **Interactive DAG flow diagram** visualizing all dependencies as a project roadmap
- **Threaded comments** on tasks
- **Real-time notifications** (via Supabase Realtime)
- **Team collaboration** via email invitations
- **Role-based access control** (Owner / Editor — only 2 roles used in practice)
- **Search and filter** by title, assignee, status
- **Row Level Security** on every table in the database

---

## 2. Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables (see section 14 for details)
# Create .env with VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY

# Start dev server on localhost:8080
npm run dev

# Production build
npm run build

# Lint
npm run lint

# Preview production build
npm run preview
```

**No test runner is configured.** Database migrations live in `supabase/migrations/` and are applied with `supabase db push`.

---

## 3. Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | React | 18.3.1 | UI framework |
| **Language** | TypeScript | 5.8.3 | Type safety (loose mode) |
| **Bundler** | Vite | 5.4.19 | Dev server + production builds |
| **Styling** | Tailwind CSS | 3.4.17 | Utility-first CSS |
| **UI Library** | shadcn/ui (Radix UI) | -- | 51+ accessible UI primitives |
| **Forms** | react-hook-form + Zod | 7.61 / 3.25 | Form handling + schema validation |
| **Routing** | react-router-dom | 6.30.1 | Client-side routing |
| **Server State** | @tanstack/react-query | 5.83.0 | Minimal use (mostly custom hooks) |
| **Backend** | Supabase | 2.89.0 | PostgreSQL + Auth + Realtime + RLS |
| **Drag & Drop** | @hello-pangea/dnd | 18.0.1 | Kanban drag-and-drop |
| **Graph Viz** | @xyflow/react + dagre | 12.10 / 0.8.5 | Dependency DAG visualization |
| **Icons** | lucide-react | 0.462.0 | SVG icon library |
| **Dates** | date-fns | 3.6.0 | Date formatting/manipulation |
| **Toasts** | sonner + shadcn toast | -- | User feedback notifications |
| **Charts** | recharts | 2.15.4 | Composable chart library |
| **Class Merging** | clsx + tailwind-merge | -- | Conditional Tailwind classes |

---

## 4. Project Structure

```
flowlink-tasks/
├── src/
│   ├── main.tsx                          # React DOM mount point
│   ├── App.tsx                           # Router + providers + auth wrappers
│   ├── index.css                         # Tailwind + CSS variables + custom classes
│   ├── vite-env.d.ts                     # Vite type references
│   │
│   ├── pages/
│   │   ├── Auth.tsx                      # Login / signup page
│   │   ├── Index.tsx                     # Main Kanban board page
│   │   ├── DependencyView.tsx            # DAG dependency graph page
│   │   ├── Team.tsx                      # Team management page
│   │   ├── Profile.tsx                   # User profile page
│   │   └── NotFound.tsx                  # 404 page
│   │
│   ├── components/
│   │   ├── KanbanBoard.tsx               # DragDropContext + board logic
│   │   ├── KanbanColumn.tsx              # Droppable column container
│   │   ├── TaskCard.tsx                  # Draggable task card
│   │   ├── CreateTaskModal.tsx           # New task form (react-hook-form + Zod)
│   │   ├── TaskDetailModal.tsx           # Task detail view + edit + deps + comments
│   │   ├── DependencyFlowView.tsx        # ReactFlow graph visualization
│   │   ├── Header.tsx                    # Top nav bar (search, notifications, user menu)
│   │   ├── BoardHeader.tsx               # Board toolbar (switcher, filters, team)
│   │   ├── BoardSwitcher.tsx             # Board dropdown + create board dialog
│   │   ├── TeamManagementModal.tsx       # Invite members, manage roles
│   │   ├── PendingInvitesModal.tsx       # Accept/decline board invitations
│   │   ├── NotificationsDropdown.tsx     # Bell icon + notification list
│   │   ├── NavLink.tsx                   # Navigation link helper
│   │   └── ui/                           # 51+ shadcn/ui primitives (DO NOT hand-edit)
│   │
│   ├── hooks/
│   │   ├── useBoard.tsx                  # Central board state + BoardProvider context
│   │   ├── useAuth.tsx                   # Auth state + AuthProvider context
│   │   ├── useBoardMembers.ts            # Board members + invites data
│   │   ├── useNotifications.ts           # Notifications + realtime subscription
│   │   ├── usePendingInvites.ts          # Pending board invitations
│   │   ├── use-toast.ts                  # Toast notification hook (shadcn)
│   │   └── use-mobile.tsx                # Mobile breakpoint detection
│   │
│   ├── lib/
│   │   ├── database.ts                   # Core DB operations (boards, columns, tasks, deps)
│   │   ├── database/
│   │   │   ├── comments.ts               # Comment CRUD
│   │   │   ├── members.ts                # Board members + invites CRUD
│   │   │   └── notifications.ts          # Notification CRUD
│   │   └── utils.ts                      # cn() class merge utility
│   │
│   ├── integrations/supabase/
│   │   ├── client.ts                     # Supabase client singleton
│   │   └── types.ts                      # Auto-generated DB types
│   │
│   ├── types/
│   │   └── kanban.ts                     # Custom TypeScript types
│   │
│   └── data/
│       └── initialData.ts                # Default board data
│
├── supabase/
│   ├── config.toml                       # Supabase project config
│   └── migrations/
│       ├── 20251228134126_*.sql           # Core schema (profiles, boards, columns, tasks, deps)
│       ├── 20251228135713_*.sql           # Comments + notifications + triggers
│       ├── 20251228140803_*.sql           # Board members, invites, RLS, access control
│       ├── 20260219120000_*.sql           # Task unblocked notification triggers
│       ├── 20260219130000_*.sql           # Add assignee_id to tasks
│       └── 20260219140000_*.sql           # Fix board_invites RLS policy
│
├── public/                               # Static assets
├── Configuration files (see section 14)
└── Documentation: README.md, CLAUDE.md, architecture.md, userflow.md, etc.
```

---

## 5. Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                      BROWSER                              │
│                                                           │
│  ┌─────────┐   ┌──────────┐   ┌──────────────────────┐  │
│  │  Pages   │──▶│Components│──▶│  shadcn/ui Primitives│  │
│  │  (6)     │   │  (13+)   │   │  (51+ Radix-based)   │  │
│  └────┬─────┘   └────┬─────┘   └──────────────────────┘  │
│       │              │                                     │
│       ▼              ▼                                     │
│  ┌──────────────────────────┐                             │
│  │      Custom Hooks (7)     │                             │
│  │  useBoard  useAuth        │                             │
│  │  useBoardMembers          │                             │
│  │  useNotifications         │                             │
│  │  usePendingInvites        │                             │
│  └────────────┬──────────────┘                             │
│               │                                            │
│               ▼                                            │
│  ┌──────────────────────────┐                             │
│  │   Database Layer          │                             │
│  │  src/lib/database.ts      │                             │
│  │  src/lib/database/*.ts    │                             │
│  └────────────┬──────────────┘                             │
│               │                                            │
└───────────────┼────────────────────────────────────────────┘
                │  Supabase JS Client
                ▼
┌──────────────────────────────────────────────────────────┐
│                    SUPABASE                                │
│                                                           │
│  ┌────────────┐  ┌──────────┐  ┌────────┐  ┌─────────┐ │
│  │ PostgreSQL  │  │   Auth   │  │Realtime│  │   RLS   │ │
│  │ 9 tables    │  │ JWT/email│  │ channel│  │ policies│ │
│  │ 6 triggers  │  │          │  │        │  │         │ │
│  │ 8 functions │  │          │  │        │  │         │ │
│  └────────────┘  └──────────┘  └────────┘  └─────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Key Architectural Rules

1. **No direct DB calls in components** — all queries go through `src/lib/database/`
2. **Hooks bridge DB and UI** — `useBoard` is the central state hub
3. **Two context providers**: `AuthProvider` (global), `BoardProvider` (page-scoped)
4. **Path alias**: `@/*` maps to `src/*`
5. **Don't hand-edit `src/components/ui/`** — these are shadcn/ui generated components

---

## 6. Data Flow

### Read Flow (DB → UI)

```
User navigates to /board/:boardId
  → BoardProvider initializes
    → Auto-accepts pending invites
    → fetchBoards()           → All user's boards
    → loadBoardData(board):
      → fetchColumns(boardId) → Board's columns
      → fetchTasks(columnIds)  → All tasks in those columns
      → fetchDependencies(taskIds) → All task dependencies
    → State stored in React hooks
    → Components render via useBoard() context
```

### Write Flow (UI → DB)

```
User creates a task via CreateTaskModal
  → react-hook-form validates with Zod schema
  → Calls useBoard().addTask(taskData)
    → database.createTask(taskData)  → supabase.from('tasks').insert(...)
    → Updates local state directly (no refetch)
    → Toast confirmation
  → Component re-renders with new task
```

### Drag-and-Drop Flow

```
User drags TaskCard to new column
  → KanbanBoard.onDragEnd fires
    → Check if task is blocked (warn if moving blocked task)
    → Optimistic UI update (instant move)
    → database.moveTask(taskId, newColumnId, newPosition)
    → If error: rollback by reloading from DB
    → DB trigger fires notify_task_update (task_moved notification)
    → If moved to Done: trigger checks dependent tasks for unblocking
```

### Realtime Flow (Notifications)

```
DB trigger inserts notification row
  → Supabase Realtime detects INSERT
  → Broadcasts to subscribed client channels
  → useNotifications receives payload
  → Prepends to notifications state
  → UI updates immediately (bell badge increments)
```

---

## 7. Database Schema

### Tables

#### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | FK → auth.users(id), UNIQUE, CASCADE delete |
| display_name | TEXT | Nullable |
| avatar_url | TEXT | Nullable |
| created_at | TIMESTAMP TZ | Auto |
| updated_at | TIMESTAMP TZ | Auto-updated by trigger |

#### `boards`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | TEXT | Required |
| description | TEXT | Nullable |
| owner_id | UUID | FK → auth.users(id), CASCADE delete |
| created_at | TIMESTAMP TZ | Auto |
| updated_at | TIMESTAMP TZ | Auto-updated by trigger |

#### `columns`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| board_id | UUID | FK → boards(id), CASCADE delete |
| title | TEXT | Required (e.g., "To Do", "In Progress", "Done") |
| position | INTEGER | Display order, default 0 |
| created_at | TIMESTAMP TZ | Auto |

#### `tasks`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| column_id | UUID | FK → columns(id), CASCADE delete |
| title | TEXT | Required |
| description | TEXT | Nullable |
| assignee_name | TEXT | Nullable (legacy string) |
| assignee_id | UUID | Nullable, FK → auth.users(id), SET NULL on delete |
| due_date | DATE | Nullable |
| icon | TEXT | Required, default 'planning'. Values: planning, code, design, dependency, requirements |
| position | INTEGER | Display order within column |
| created_at | TIMESTAMP TZ | Auto |
| updated_at | TIMESTAMP TZ | Auto-updated by trigger |

#### `task_dependencies`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| task_id | UUID | FK → tasks(id), CASCADE delete. The dependent (blocked) task |
| depends_on_task_id | UUID | FK → tasks(id), CASCADE delete. The blocking task |
| created_at | TIMESTAMP TZ | Auto |
| **Constraints** | | UNIQUE(task_id, depends_on_task_id), CHECK(task_id != depends_on_task_id) |

#### `comments`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| task_id | UUID | FK → tasks(id), CASCADE delete |
| user_id | UUID | Not FK (allows deleted users' comments to persist) |
| content | TEXT | Required |
| created_at | TIMESTAMP TZ | Auto |
| updated_at | TIMESTAMP TZ | Auto-updated by trigger |

#### `notifications`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | Recipient (not FK) |
| type | TEXT | task_created, task_moved, task_unblocked, comment, member_joined |
| title | TEXT | Required |
| message | TEXT | Required |
| task_id | UUID | Nullable, FK → tasks(id), CASCADE delete |
| read | BOOLEAN | Default false |
| created_at | TIMESTAMP TZ | Auto |

#### `board_members`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| board_id | UUID | FK → boards(id), CASCADE delete |
| user_id | UUID | Team member (not FK) |
| role | board_role | Enum: viewer, editor, admin, owner (only 'editor' used in practice) |
| created_at | TIMESTAMP TZ | Auto |
| updated_at | TIMESTAMP TZ | Auto-updated by trigger |
| **Constraints** | | UNIQUE(board_id, user_id) |

#### `board_invites`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| board_id | UUID | FK → boards(id), CASCADE delete |
| email | TEXT | Invitee email (lowercased) |
| role | board_role | Default 'editor' |
| invited_by | UUID | Inviter (not FK) |
| created_at | TIMESTAMP TZ | Auto |
| expires_at | TIMESTAMP TZ | Auto: now() + 7 days |
| **Constraints** | | UNIQUE(board_id, email) |

### Enum: `board_role`

Values in DB: `viewer` < `editor` < `admin` < `owner`

**In practice, only 2 roles are used:** `owner` (implicit via `boards.owner_id`) and `editor` (all invited members). The `admin` and `viewer` roles exist in the enum and RLS functions but are never assigned by the app.

### Database Functions

| Function | Purpose |
|----------|---------|
| `has_board_access(board_id, user_id, min_role)` | Returns boolean. Checks if user is owner OR has sufficient role. Used by all RLS policies |
| `can_edit_board(board_id, user_id)` | Shorthand for `has_board_access(..., 'editor')` |
| `can_manage_board(board_id, user_id)` | Shorthand for `has_board_access(..., 'admin')` |
| `handle_new_user()` | Trigger: auto-creates profile on auth.users INSERT |
| `update_updated_at_column()` | Trigger: sets updated_at = now() on UPDATE |
| `accept_board_invite(invite_id)` | RPC: validates invite, creates board_member, deletes invite |
| `notify_task_update()` | Trigger: creates task_created/task_moved notifications |
| `notify_comment()` | Trigger: creates comment notification to board owner |
| `notify_task_unblocked()` | Trigger: when task moves to Done, checks if dependent tasks are unblocked |
| `notify_dependency_removed_unblock()` | Trigger: when dependency deleted, checks if task is now unblocked |
| `notify_member_joined()` | Trigger: notifies board owner when member joins |

### Triggers

| Trigger | Table | Event | Function |
|---------|-------|-------|----------|
| `on_auth_user_created` | auth.users | AFTER INSERT | handle_new_user() |
| `update_*_updated_at` | profiles, boards, tasks, comments, board_members | BEFORE UPDATE | update_updated_at_column() |
| `on_task_update` | tasks | AFTER INSERT OR UPDATE | notify_task_update() |
| `on_comment_created` | comments | AFTER INSERT | notify_comment() |
| `on_task_unblocked` | tasks | AFTER UPDATE | notify_task_unblocked() |
| `on_dependency_removed` | task_dependencies | AFTER DELETE | notify_dependency_removed_unblock() |
| `on_member_joined` | board_members | AFTER INSERT | notify_member_joined() |

---

## 8. Authentication

### Sign Up Flow

1. User submits email + password + display name (Zod-validated)
2. `supabase.auth.signUp()` creates user in `auth.users`
3. Trigger `handle_new_user()` auto-creates a `profiles` row
4. JWT stored in localStorage, session auto-refreshes
5. `AuthProvider` detects state change, redirects to `/`

### Sign In Flow

1. User submits email + password
2. `supabase.auth.signInWithPassword()` validates credentials
3. JWT returned and stored in localStorage
4. Auth listener fires, user redirected to `/`
5. `useBoard` auto-accepts any pending board invites

### Sign Out

1. `supabase.auth.signOut()` clears session
2. Auth listener fires, state cleared
3. `ProtectedRoute` redirects to `/auth`

### Route Protection

- **`ProtectedRoute`**: Checks `user && !loading` → redirects unauthenticated to `/auth`
- **`PublicRoute`**: Redirects authenticated users to `/`

---

## 9. Role-Based Access Control

### Roles In Practice: Owner vs Editor

While the database defines a 4-role enum (`viewer < editor < admin < owner`), **only 2 roles are actually used in the app:**

| Role | How It's Determined | Count Per Board |
|------|-------------------|-----------------|
| **Owner** | `boards.owner_id = user.id` (the board creator) | Exactly 1 |
| **Editor** | `board_members.role = 'editor'` (all invited members) | 0 or more |

The `admin` and `viewer` roles exist in the DB schema and RLS functions but are **dead code** — no UI path assigns them.

### How the Frontend Checks Roles

All role checks in the UI use a simple binary pattern:

```typescript
// Every component that needs role checks does this:
const isOwner = board?.owner_id === user?.id;
```

There is no `isAdmin`, `isEditor`, or `isViewer` check anywhere.

### What Each Role Can Do

| Action | Editor | Owner |
|--------|--------|-------|
| View board, tasks, comments | Yes | Yes |
| Create/edit/move/delete tasks | Yes | Yes |
| Create/delete dependencies | Yes | Yes |
| Add comments | Yes | Yes |
| Be assigned to tasks | Yes | Yes |
| Invite members | No | Yes |
| Cancel pending invites | No | Yes |
| Remove members | No | Yes |
| Rename/delete board | No | Yes |

### How Invitations Work

Both `TeamManagementModal` and `Team.tsx` hard-code the role to `'editor'`:

```typescript
// TeamManagementModal.tsx:55
await createBoardInvite(board.id, inviteEmail, 'editor');

// Team.tsx:45
await createBoardInvite(currentBoard.id, inviteEmail, 'editor');
```

The invite UI is only rendered when `isOwner` is true — editors cannot invite others.

### RLS Policy Pattern

Every table has RLS enabled. The DB functions support the full 4-role hierarchy, but since only `owner` and `editor` exist in practice:

```sql
-- SELECT policies check: is owner OR has_board_access(..., 'viewer')
-- Since all members are 'editor', they pass the 'viewer' minimum check

-- INSERT/UPDATE policies check: is owner OR can_edit_board(...)
-- can_edit_board requires 'editor' minimum — all members qualify

-- Member management policies check: can_manage_board(...)
-- can_manage_board requires 'admin' minimum — only the owner passes
-- (because has_board_access returns TRUE for owner regardless of role check)
```

All access-control functions use `SECURITY DEFINER` (run as superuser) to bypass RLS when checking permissions.

### Future Note

To enable the full 4-role system, you'd need to:
1. Add a role selector dropdown to the invite UI (instead of hard-coding `'editor'`)
2. Add frontend checks like `isAdmin = member?.role === 'admin'` for conditional rendering
3. The DB layer already supports it — no migration changes needed

---

## 10. Frontend: Pages & Routing

### Route Table

| Path | Page | Protection | Description |
|------|------|-----------|-------------|
| `/auth` | Auth.tsx | PublicRoute | Login / signup |
| `/` | Index.tsx | ProtectedRoute | Main Kanban board (default board) |
| `/board/:boardId` | Index.tsx | ProtectedRoute | Specific board view |
| `/board/:boardId/dependencies` | DependencyView.tsx | ProtectedRoute | DAG graph visualization |
| `/board/:boardId/team` | Team.tsx | ProtectedRoute | Team management |
| `/profile` | Profile.tsx | ProtectedRoute | User profile settings |
| `*` | NotFound.tsx | None | 404 page |

### Provider Hierarchy

```
<QueryClientProvider>        ← React Query
  <TooltipProvider>          ← shadcn/ui tooltips
    <Toaster /> + <Sonner /> ← Toast notifications
    <BrowserRouter>          ← React Router
      <AuthProvider>         ← Auth context (wraps all routes)
        <Routes>
          <BoardProvider>    ← Board context (wraps board pages only)
            <Index />
            <DependencyView />
          </BoardProvider>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </TooltipProvider>
</QueryClientProvider>
```

---

## 11. Frontend: Components

### Board Components

| Component | File | Purpose |
|-----------|------|---------|
| **KanbanBoard** | `src/components/KanbanBoard.tsx` | DragDropContext root. Manages filtered tasks, modal state, drag-end logic with blocking validation |
| **KanbanColumn** | `src/components/KanbanColumn.tsx` | Droppable wrapper. Renders task cards + "Add Task" button. Visual feedback when dragging over |
| **TaskCard** | `src/components/TaskCard.tsx` | Draggable card. Shows title, assignee, category icon, blocked badge, dependency count |
| **BoardSwitcher** | `src/components/BoardSwitcher.tsx` | Board dropdown + create board dialog |
| **BoardHeader** | `src/components/BoardHeader.tsx` | Board toolbar: switcher, stats, team avatars, filters, rename/delete actions |

### Modal Components

| Component | File | Purpose |
|-----------|------|---------|
| **CreateTaskModal** | `src/components/CreateTaskModal.tsx` | New task form: title, description, assignee, due date, category, column. Uses react-hook-form + Zod |
| **TaskDetailModal** | `src/components/TaskDetailModal.tsx` | Full task view: edit fields, manage dependencies (add/remove), comments thread, delete task |
| **TeamManagementModal** | `src/components/TeamManagementModal.tsx` | Invite by email, pending invites list, member list, remove member (owner only) |
| **PendingInvitesModal** | `src/components/PendingInvitesModal.tsx` | Accept/decline board invitations with board details |

### Navigation & Layout

| Component | File | Purpose |
|-----------|------|---------|
| **Header** | `src/components/Header.tsx` | Top nav: logo, nav links, search input, pending invites badge, notifications dropdown, user menu, mobile drawer |
| **NotificationsDropdown** | `src/components/NotificationsDropdown.tsx` | Bell icon + badge, notification list, mark read, icon per notification type |

### Visualization

| Component | File | Purpose |
|-----------|------|---------|
| **DependencyFlowView** | `src/components/DependencyFlowView.tsx` | ReactFlow + dagre. Builds DAG from tasks/dependencies. Custom TaskFlowNode. LR layout. Interactive (pan, zoom, minimap). Edge highlighting on hover |

---

## 12. Hooks & State Management

### `useBoard` (Central Hub)

**File:** `src/hooks/useBoard.tsx`

The most important hook. Provides `BoardProvider` context wrapping board pages.

**State:**
- `boards` — all user's boards
- `currentBoard` — active board
- `columns`, `tasks`, `dependencies` — current board's data
- `searchQuery`, `filterAssignee`, `filterStatus` — UI filter state
- `loading`, `error` — request state

**Methods:**
- `addTask(data)` — create task, update local state
- `moveTask(id, columnId, position)` — optimistic drag-drop update
- `switchBoard(boardId)` — navigate to different board
- `refresh()` — reload current board data
- `reloadBoards()` — refresh boards list
- `refreshDependencies()` — reload only dependencies
- `handleCreateBoard(name, desc)` — create board with default columns
- `handleUpdateBoard(id, updates)` — rename board
- `handleDeleteBoard(id)` — delete board, create default if last
- `setSearchQuery`, `setFilterAssignee`, `setFilterStatus` — filter setters

**Init behavior:**
1. Auto-accepts pending board invites
2. Fetches all boards
3. Creates default "My First Board" if user has zero boards
4. Loads selected board's data (columns → tasks → dependencies)

**Access patterns:**
- `useBoard()` — throws if used outside `BoardProvider`
- `useBoardOptional()` — returns null if outside provider (safe for Header)

### `useAuth`

**File:** `src/hooks/useAuth.tsx`

**State:** `user`, `session`, `loading`
**Methods:** `signUp()`, `signIn()`, `signOut()`

Wraps `supabase.auth` with toast notifications and error handling.

### `useBoardMembers`

**File:** `src/hooks/useBoardMembers.ts`

**Props:** `boardId: string | null`
**State:** `members` (with profile data), `invites`, `loading`
**Method:** `refresh()`

### `useNotifications`

**File:** `src/hooks/useNotifications.ts`

**State:** `notifications`, `unreadCount`, `loading`
**Methods:** `markRead(id)`, `markAllRead()`, `refresh()`

**Realtime:** Subscribes to `postgres_changes` on notifications table filtered by `user_id=eq.${user.id}`. New inserts are prepended to state immediately.

### `usePendingInvites`

**File:** `src/hooks/usePendingInvites.ts`

**State:** `invites` (with board details), `loading`
**Methods:** `acceptInvite(id)`, `refresh()`

### `useToast` / `useIsMobile`

shadcn/ui utilities. Toast uses reducer-based global state. Mobile detects viewport < 768px.

---

## 13. Feature Deep Dives

### 13.1 Drag-and-Drop

**Library:** `@hello-pangea/dnd`

**Component hierarchy:**
```
KanbanBoard (DragDropContext, onDragEnd)
  └── KanbanColumn (Droppable, droppableId=column.id)
       └── TaskCard (Draggable, draggableId=task.id)
```

**onDragEnd logic:**
1. If no destination → return
2. Check if task is blocked (dependencies not all in Done)
3. If dragging blocked task to In Progress/Done → show warning toast
4. Call `moveTask(taskId, newColumnId, newPosition)` → optimistic update
5. If DB fails → rollback by reloading board

**Visual feedback:**
- Column gets blue ring + background when dragging over
- Task card scales up (1.02x), adds shadow + ring when dragging
- Blocked tasks show reduced opacity (75%)

### 13.2 Task Dependencies

**Data model:** `task_dependencies(task_id, depends_on_task_id)` — "task_id depends on depends_on_task_id"

**Blocked calculation** (in KanbanBoard):
```
For each task:
  1. Get all depends_on_task_ids from dependencies
  2. Filter to those NOT in "Done" columns
  3. If any remain → task is blocked
```

**UI indicators:**
- TaskCard shows "Blocked by N task(s)" badge
- TaskDetailModal shows dependency list with add/remove
- DependencyFlowView shows full DAG

**Automatic unblocking notifications:**
- When a task moves to Done → trigger checks all tasks that depend on it
- For each dependent: count remaining non-done blockers
- If zero → insert "task_unblocked" notification

### 13.3 Dependency Graph (DAG)

**Libraries:** `@xyflow/react` (ReactFlow) + `dagre`

**Layout:**
- Direction: LR (left-to-right)
- Node separation: 80px vertical, 160px horizontal
- Node size: 260px x 130px

**Custom node (`TaskFlowNode`):**
- Color-coded by status (amber = To Do, blue = In Progress, emerald = Done)
- Shows task icon, title, assignee, dependency count, blocking count

**Edges:**
- Smooth step connections with directional arrows
- Animated (dashed moving line)
- Blue stroke (#3b82f6)

**Interaction:**
- Hover node → highlights connected edges, dims unrelated
- Pan, zoom, fit-to-view controls
- Minimap in corner

### 13.4 Team Collaboration

**Only 2 roles exist in practice: Owner and Editor.** The invite system always assigns `'editor'` — there's no role picker in the UI.

**Invitation flow:**
1. Owner (only owners see the invite section) enters email in TeamManagementModal or Team page
2. `createBoardInvite(boardId, email, 'editor')` → hard-coded 'editor' role → inserts into board_invites (expires in 7 days)
3. Invitee sees pending invite in PendingInvitesModal (or auto-accepted on login)
4. `acceptBoardInvite(inviteId)` → RPC function validates email match, creates board_member with 'editor' role, deletes invite
5. `notify_member_joined` trigger fires → owner gets notification

**Owner-only UI** (gated by `board.owner_id === user.id`):
- Invite section (email input + send button)
- Cancel pending invite buttons
- Remove member buttons

**Editor UI** (all members including owner):
- View all board content
- Create/edit/move/delete tasks and dependencies
- Add comments
- Be listed as assignee options

**Auto-accept:** When a user logs in, `useBoard` automatically accepts all pending invites before loading boards.

**TeamManagementModal sections:**
1. Invite by Email (owner only) — shows message: "They'll sign up with this email and automatically join as an editor"
2. Pending Invitations — list with cancel buttons (owner only)
3. Board Owner — displayed with Crown icon
4. Editors — listed with Pencil icon + "Editor" badge, described as "Can create and edit tasks"

### 13.5 Comments

**Flow:**
1. Open TaskDetailModal → comments fetched for that task
2. User types comment → `createComment(taskId, content)`
3. Appended to local state (no refetch)
4. DB trigger `notify_comment` fires → board owner gets notification

### 13.6 Search & Filtering

All filtering is **client-side** (instant, no network latency):

```typescript
// In KanbanBoard useMemo
let result = tasks;
if (searchQuery) → filter by title/description includes
if (filterAssignee) → filter by assignee_name (or '_unassigned')
if (filterStatus) → filter by column_id
```

Search input lives in Header. Filter dropdowns live in BoardHeader popover.

### 13.7 Notifications

**Types:** task_created, task_moved, task_unblocked, comment, member_joined

**Created by:** Database triggers (SECURITY DEFINER), never from frontend code.

**Delivered via:** Supabase Realtime postgres_changes subscription.

**UI:** NotificationsDropdown with bell icon, unread badge, mark read, icon per type.

---

## 14. Configuration Files

### Environment Variables (`.env`)

```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
```

`VITE_` prefix required for Vite to expose to client code via `import.meta.env`.

### Vite (`vite.config.ts`)

- **React SWC plugin** (faster than Babel)
- **Port:** 8080 (IPv6 enabled: `::`)
- **Path alias:** `@` → `src/`
- **Dev-only:** lovable-tagger component tagger

### TypeScript (`tsconfig.json` + `tsconfig.app.json`)

- **Target:** ES2020
- **Strict mode:** OFF (noImplicitAny, strictNullChecks disabled)
- **JSX:** react-jsx (modern transform)
- **Module:** ESNext with bundler resolution
- **Path alias:** `@/*` → `src/*`

### Tailwind (`tailwind.config.ts`)

- **Dark mode:** class-based strategy
- **Font:** Plus Jakarta Sans
- **Colors:** All CSS variable-based (HSL)
- **Animations:** fade-in, slide-in, shimmer, pulse-soft, accordion
- **Plugin:** tailwindcss-animate

### ESLint (`eslint.config.js`)

- **Flat config** (modern ESLint 9 format)
- **Extends:** JS recommended + TypeScript recommended
- **Plugins:** react-hooks, react-refresh
- **Disabled:** @typescript-eslint/no-unused-vars

### shadcn/ui (`components.json`)

- **Style:** default
- **RSC:** false (no Server Components)
- **CSS variables:** enabled
- **Base color:** slate

---

## 15. Styling System

### CSS Variables (in `src/index.css`)

All theme colors defined as HSL CSS variables:

```css
:root {
  --primary: 221 83% 53%;      /* Vivid blue */
  --background: 220 20% 97%;   /* Off-white */
  --foreground: 222 47% 11%;   /* Dark blue-gray */
  --card: 0 0% 100%;           /* Pure white */
  --destructive: 0 84% 60%;    /* Red */
  --border: 220 13% 91%;       /* Light gray */
  --glass-bg: 0 0% 100% / 0.85; /* Semi-transparent white */
  --radius: 0.75rem;
}
```

### Custom Classes

```css
.glass-card       /* Frosted glass: white bg + border + subtle shadow */
.task-card-hover  /* Hover: translateY(-2px) + enhanced shadow */
.page-container   /* max-w-5xl centered wrapper */
.section-card     /* Card with spacing */
```

### Body Background

Linear gradient: light blue → white → light indigo (160deg)

### Font

**Plus Jakarta Sans** (Google Fonts) with weights 300-800.

---

## 16. Key Patterns & Conventions

### Import Alias
```typescript
import { KanbanBoard } from '@/components/KanbanBoard';
import { useBoard } from '@/hooks/useBoard';
import { createTask } from '@/lib/database';
```

### Database Layer Pattern
All Supabase queries isolated in `src/lib/database.ts` and `src/lib/database/*.ts`. Components never call `supabase.from()` directly.

### Optimistic Updates
Used for drag-and-drop: update local state immediately, sync with DB, rollback on error.

### State Updates After Mutations
Most mutations update local state directly after DB confirms (no full refetch). Exception: error recovery reloads from DB.

### Concurrent Init Guard
`useBoard` uses `useRef` flags (`initCalled`, `creatingDefaultBoard`) to prevent double-initialization in React StrictMode.

### Form Validation
All forms use `react-hook-form` + `Zod` schemas. Validation happens client-side before any DB call.

### Toast Notifications
Used for all user feedback: success, error, warnings. Both shadcn toast and Sonner are available.

### Class Merging
`cn()` utility from `src/lib/utils.ts` combines `clsx` + `tailwind-merge` for conditional Tailwind classes.

### Generated Types
`src/integrations/supabase/types.ts` is auto-generated. Regenerate with `supabase gen types typescript`.

---

## 17. Known Limitations & Future Work

### Current Limitations

- **No test suite** — no unit, integration, or E2E tests configured
- **No caching layer** — all state is in-memory React hooks; page refresh reloads everything
- **Multi-tab sync** — multiple browser tabs don't sync state (each maintains its own)
- **Notifications target board owner only** — most triggers notify the board owner, not task assignees
- **Client-side filtering only** — search/filter runs in browser, not pushed to DB queries
- **No dark mode toggle UI** — CSS variables defined but no user-facing toggle
- **`assignee_name` vs `assignee_id`** — dual fields exist; `assignee_id` added later but `assignee_name` still primary
- **Only 2 of 4 roles used** — DB enum has viewer/editor/admin/owner but only owner and editor are implemented in the UI; admin and viewer are dead code

### Potential Improvements

- Add Vitest + React Testing Library + Playwright for testing
- Implement React Query caching for server state
- Add Supabase Realtime subscriptions for task/column changes (not just notifications)
- Extend notification targets to assignees and commenters
- Add dark mode toggle
- Migrate fully to `assignee_id` and join with profiles
- Enable the full 4-role system (add role selector to invite UI; DB already supports it)
- Add board activity log
- Add task labels/tags
- Add due date reminders
- Add file attachments via Supabase Storage

---

## 18. Credits

**Built by:** Prakrit Ojha & Anish Kunwar
**Academic context:** BCA 4th Semester, Samriddhi College, Tribhuvan University
**Supervisor:** Mr. Abhishek Dewan
**Methodology:** Waterfall

---

*Last updated: February 2026*
