# TaskLink -- Collaborative Kanban Project Manager

A full-stack collaborative project management app built with React, TypeScript, and Supabase.

---

## Features

| Feature | Description |
|---------|-------------|
| **Authentication** | Email/password signup & login with auto-created profiles |
| **Kanban Board** | Drag-and-drop tasks across To Do, In Progress, and Done columns |
| **Multiple Boards** | Create, rename, delete, and switch between project boards |
| **Task CRUD** | Create, view, edit, and delete tasks with title, description, assignee, due date, and category |
| **Task Dependencies** | Link tasks that block each other; blocked tasks show visual indicators |
| **Comments** | Threaded comments on tasks for team discussion |
| **Real-time Notifications** | Live alerts for task creation, moves, unblocks, comments, and team joins |
| **Team Collaboration** | Invite members by email; invited users auto-join on signup/login |
| **Dependency Flow View** | Interactive DAG visualization of task dependency chains (ReactFlow + dagre) |
| **Search & Filter** | Search tasks by title/description; filter by assignee or status column |
| **Profile Management** | View and edit display name on a dedicated profile page |

---

## Testing Guide

### 1. Authentication
```
1. Go to /auth
2. Click "Create account" -> enter name, email, password, confirm password
3. Submit -> redirects to main board (default board auto-created on first login)
4. Click avatar -> Sign out -> Sign back in
```

### 2. Create & Manage Tasks
```
1. Click "Add Task" in any column
2. Fill in title, description, assignee, due date, category
3. Drag tasks between columns to update status
4. Click a task card to open the detail modal
5. Click the pencil icon to edit fields -> click Save
6. In edit mode, click Delete -> Confirm? to remove the task
```

### 3. Task Dependencies
```
1. Create 2+ tasks
2. Click on a task -> open details
3. In "Dependencies" section, select another task -> click +
4. Blocked tasks show an amber "Blocked by N tasks" badge
5. Go to Dependencies page (header nav) to see the visual flow diagram
```

### 4. Comments
```
1. Click on any task
2. Scroll to "Comments" section
3. Type a comment -> click "Send Comment"
4. Comments show "You" or "Team member" with relative timestamps
```

### 5. Notifications
```
1. Create or move a task -> bell icon shows notification badge
2. Click bell -> view all notifications (up to 50, newest first)
3. Click a notification to mark it read, or "Mark all read" to clear all
```

### 6. Multiple Boards
```
1. Click the board name dropdown (top left of board)
2. Click "Create new board" -> enter name & description
3. Switch boards using the dropdown
4. Use board actions menu to rename or delete a board
```

### 7. Team Collaboration
```
Owner (User A):
  1. Click the + button next to team avatars in the board header
  2. Enter teammate's email
  3. Click the invite button (member joins as editor)

Invited User (User B):
  1. Sign up with the invited email address
  2. Pending invites are auto-accepted on login
  3. Shared board appears in the board switcher immediately
  4. (Or: click mail icon in header -> view invitation -> click "Accept")
```

### 8. Search & Filter
```
1. Type in the search bar (header) to filter tasks by title or description
2. Click Filter button in board header to filter by assignee or status column
3. Active filters show as pills with X to remove
```

---

## User Stories

### Authentication
- As a new user, I can create an account so my data is saved.
- As a returning user, I can log in to access my boards.
- As a user, I can sign out to secure my account.

### Task Management
- As a user, I can create tasks with a title, description, assignee, due date, and category.
- As a user, I can drag tasks between columns to update their status.
- As a user, I can click a task to view its details, comments, and dependencies.
- As a user, I can edit a task's fields inline from the detail modal.
- As a user, I can delete a task with a two-click confirmation.

### Dependencies
- As a user, I can add dependencies to show which tasks block others.
- As a user, I can remove dependencies when no longer relevant.
- As a user, I can see a visual flow diagram of all task dependencies.
- As a user, I can see blocked tasks highlighted with an amber badge.

### Comments
- As a user, I can comment on tasks to communicate with my team.
- As a user, I can see all comments on a task in chronological order.

### Notifications
- As a user, I receive real-time notifications when tasks are created, moved, or unblocked.
- As a user, I receive notifications when someone comments on a task.
- As a user, I receive notifications when someone joins my board.
- As a user, I can mark notifications as read individually or all at once.

### Multiple Boards
- As a user, I can create multiple boards for different projects.
- As a user, I can switch between boards using a dropdown.
- As a user, I can rename or delete boards I own.

### Team Collaboration
- As a board owner, I can invite teammates by email.
- As an invited user, my invite is auto-accepted when I sign up or log in.
- As an invited user, I can also manually accept invitations via the mail icon.
- As an editor, I can create, edit, move, and delete tasks on shared boards.
- As a board owner, I can remove members from my board.

### Profile
- As a user, I can view and edit my display name on the profile page.

---

## Access Control

TaskLink uses a simple two-level access model:

| Role | How assigned | Permissions |
|------|-------------|-------------|
| **Owner** | Board creator (tracked via `boards.owner_id`) | Full control: all task operations, invite/remove members, rename/delete board |
| **Editor** | Invited members (all invites default to editor) | Create, edit, move, delete tasks; manage dependencies; add comments; drag & drop |

Row Level Security (RLS) policies on Supabase enforce these permissions at the database level. The owner is identified by `boards.owner_id`. All invited members are stored in `board_members` with the `editor` role.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Supabase (Postgres, Auth, RLS, Realtime) |
| Drag & Drop | @hello-pangea/dnd |
| Dependency Graph | @xyflow/react (ReactFlow) + dagre |
| State | React Context + hooks + Supabase Realtime subscriptions |
| Routing | react-router-dom v6 |
| Forms | react-hook-form + Zod validation |
| Build | Vite + SWC |

---

## Project Structure

```
src/
├── components/
│   ├── Header.tsx               # App header with nav, search, notifications, profile
│   ├── NavLink.tsx              # Active-aware navigation link wrapper
│   ├── KanbanBoard.tsx          # Main board with drag-and-drop context
│   ├── KanbanColumn.tsx         # Droppable column with task list
│   ├── TaskCard.tsx             # Draggable task card with blocked indicator
│   ├── TaskDetailModal.tsx      # Task view/edit/delete, dependencies, comments
│   ├── CreateTaskModal.tsx      # Form modal to create tasks (Zod validated)
│   ├── BoardSwitcher.tsx        # Board selection dropdown + create board
│   ├── BoardHeader.tsx          # Board stats, team avatars, filters
│   ├── DependencyFlowView.tsx   # Interactive DAG dependency diagram (ReactFlow)
│   ├── TeamManagementModal.tsx  # Invite & manage team members
│   ├── NotificationsDropdown.tsx# Bell icon dropdown with notification list
│   ├── PendingInvitesModal.tsx  # Accept board invitations
│   └── ui/                      # shadcn/ui primitives (button, dialog, etc.)
├── hooks/
│   ├── useAuth.tsx              # Auth context (sign up, sign in, sign out)
│   ├── useBoard.tsx             # Central board/column/task/dependency state & CRUD
│   ├── useNotifications.ts      # Realtime notification subscriptions
│   ├── useBoardMembers.ts       # Board members & pending invites
│   ├── usePendingInvites.ts     # Invitation accept logic
│   ├── use-mobile.tsx           # Viewport breakpoint detection
│   └── use-toast.ts             # Toast notification system
├── lib/
│   ├── database.ts              # Core DB layer: boards, columns, tasks, deps
│   ├── database/
│   │   ├── comments.ts          # Comments CRUD
│   │   ├── notifications.ts     # Notifications CRUD
│   │   └── members.ts           # Team members & invites CRUD
│   └── utils.ts                 # cn() — Tailwind class merge utility
├── integrations/
│   └── supabase/
│       ├── client.ts            # Supabase client initialization
│       └── types.ts             # Auto-generated DB type definitions
├── types/
│   └── kanban.ts                # Task, Column, Board, DependencyLine interfaces
└── pages/
    ├── Auth.tsx                 # Login / signup (Zod validated)
    ├── Index.tsx                # Main board view (protected)
    ├── DependencyView.tsx       # Dependency flow diagram (protected)
    ├── Profile.tsx              # User profile view & edit (protected)
    ├── Team.tsx                 # Team management page (protected)
    └── NotFound.tsx             # 404 page
```

---

## Routes

| Path | Access | Page | Description |
|------|--------|------|-------------|
| `/auth` | Public | Auth | Login / signup (redirects to `/` if already authenticated) |
| `/` | Protected | Index | Redirects to `/board/:boardId` |
| `/board/:boardId` | Protected | Index | Main Kanban board view |
| `/board/:boardId/dependencies` | Protected | DependencyView | Interactive task dependency flow diagram |
| `/board/:boardId/team` | Protected | Team | Team member management |
| `/profile` | Protected | Profile | User profile view & edit |
| `*` | Public | NotFound | 404 page |

---

## Database Schema (Supabase)

### Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User display names & avatars (auto-created on signup via trigger) |
| `boards` | Project boards owned by users |
| `columns` | Kanban columns belonging to a board (To Do, In Progress, Done) |
| `tasks` | Tasks within columns (title, description, assignee, due date, icon) |
| `task_dependencies` | Links between tasks (task A depends on task B) |
| `comments` | Comments on tasks |
| `notifications` | User notifications (task created/moved/unblocked, comments, member joined) |
| `board_members` | Team membership per board (all members are editors) |
| `board_invites` | Pending email invitations (expire after 7 days) |

### Key Functions

| Function | Purpose |
|----------|---------|
| `has_board_access(board, user, role)` | Checks if user has at least the given role |
| `can_edit_board(board, user)` | Shorthand for editor access |
| `accept_board_invite(invite)` | Accepts invite, adds user as editor member, deletes invite |

### Triggers

| Trigger | Event | Action |
|---------|-------|--------|
| `on_auth_user_created` | New user signup | Auto-creates profile |
| `update_*_updated_at` | Row update on multiple tables | Sets `updated_at = now()` |
| `on_task_update` | Task insert/move | Notifies board owner |
| `on_comment_created` | New comment | Notifies board owner |
| `on_member_joined` | New board member | Notifies board owner |
| `on_task_unblocked` | Task moved to Done / dependency removed | Notifies dependent task owners |

All tables have **Row Level Security** enabled. The board owner (via `boards.owner_id`) has full control. Invited editors (via `board_members`) can create, edit, move, and delete tasks.

---

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
```

Get these from your [Supabase Dashboard](https://supabase.com/dashboard) -> Settings -> API.

---

## Running Locally

```sh
git clone https://github.com/PrakritOjha/flowlink-tasks.git
cd flowlink-tasks
npm install
npm run dev
```

The dev server starts at `http://localhost:8080`.

### With Supabase CLI (optional)

```sh
supabase login
supabase link --project-ref YOUR_SUPABASE_PROJECT_ID
supabase db push   # applies migrations from supabase/migrations/
```
