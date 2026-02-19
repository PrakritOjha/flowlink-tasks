# TaskLink — Collaborative Kanban Project Manager

A full-stack collaborative project management app built with React, TypeScript, and Supabase.

---

## 🚀 Features

| Feature | Description |
|---------|-------------|
| **Authentication** | Email/password signup & login |
| **Kanban Board** | Drag-and-drop tasks across columns |
| **Multiple Boards** | Create and switch between project boards |
| **Task Dependencies** | Link tasks that block each other |
| **Comments** | Add comments to tasks for team discussion |
| **Real-time Notifications** | Alerts for task creation, moves, comments, and team joins |
| **Team Collaboration** | Invite members by email with role-based permissions |
| **Role-Based Access** | Viewer, Editor, Admin, Owner permission levels |
| **Dependency Flow View** | Visual diagram of task dependency chains |

---

## 🧪 Testing Guide

### 1. Authentication
```
1. Go to /auth
2. Click "Create account" → enter name, email, password
3. Submit → redirects to main board
4. Click avatar → Sign out → Sign back in
```

### 2. Create & Manage Tasks
```
1. Click "Add Task" in any column
2. Fill in title, description, assignee, due date, icon
3. Drag tasks between columns to update status
4. Click a task card to open the detail modal
```

### 3. Task Dependencies
```
1. Create 2+ tasks
2. Click on a task → open details
3. In "Dependencies" section, select another task → click +
4. Go to /dependencies to see the visual flow diagram
```

### 4. Comments
```
1. Click on any task
2. Scroll to "Comments" section
3. Type a comment → click "Send Comment"
```

### 5. Notifications
```
1. Create or move a task → bell icon shows notification badge
2. Click bell → view all notifications
3. Click "Mark all read" to clear
```

### 6. Multiple Boards
```
1. Click the board name dropdown (top left of board)
2. Click "Create new board" → enter name & description
3. Switch boards using the dropdown
```

### 7. Team Collaboration
```
Owner (User A):
  1. Click the + button next to team avatars in the board header
  2. Enter teammate's email and select a role
  3. Click the invite button

Invited User (User B):
  1. Sign up with the invited email address
  2. See the mail icon with a badge in the header
  3. Click mail icon → view invitation → click "Accept"
  4. Shared board now appears in the board list
```

---

## 👤 User Stories

### Authentication
- As a new user, I can create an account so my data is saved.
- As a returning user, I can log in to access my boards.
- As a user, I can sign out to secure my account.

### Task Management
- As a user, I can create tasks with a title, description, assignee, due date, and icon.
- As a user, I can drag tasks between columns to update their status.
- As a user, I can click a task to view and edit its details.

### Dependencies
- As a user, I can add dependencies to show which tasks block others.
- As a user, I can remove dependencies when no longer relevant.
- As a user, I can see a visual flow diagram of all task dependencies.

### Comments
- As a user, I can comment on tasks to communicate with my team.
- As a user, I can see all comments on a task in chronological order.

### Notifications
- As a user, I receive notifications when tasks are created or moved.
- As a user, I receive notifications when someone comments on a task.
- As a user, I receive notifications when someone joins my board.
- As a user, I can mark notifications as read.

### Multiple Boards
- As a user, I can create multiple boards for different projects.
- As a user, I can switch between boards using a dropdown.

### Team Collaboration
- As a board owner, I can invite teammates by email with a specific role.
- As a board admin, I can change member roles or remove members.
- As an invited user, I can accept invitations to join boards.
- As a viewer, I can view the board and add comments.
- As an editor, I can create and edit tasks.
- As an admin, I can manage team members.

---

## 🔐 Role Permissions

| Action | Viewer | Editor | Admin | Owner |
|--------|:------:|:------:|:-----:|:-----:|
| View board & tasks | ✅ | ✅ | ✅ | ✅ |
| Add comments | ✅ | ✅ | ✅ | ✅ |
| Create/edit/move tasks | ❌ | ✅ | ✅ | ✅ |
| Add/remove dependencies | ❌ | ✅ | ✅ | ✅ |
| Invite team members | ❌ | ❌ | ✅ | ✅ |
| Change member roles | ❌ | ❌ | ✅ | ✅ |
| Remove members | ❌ | ❌ | ✅ | ✅ |
| Delete board | ❌ | ❌ | ❌ | ✅ |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Supabase (Postgres, Auth, RLS, Realtime) |
| Drag & Drop | @hello-pangea/dnd |
| Charts | Recharts |
| State | React hooks + Supabase realtime subscriptions |
| Routing | react-router-dom |
| Build | Vite + SWC |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── Header.tsx               # App header with nav, search, notifications, profile
│   ├── NavLink.tsx              # Active-aware navigation link wrapper
│   ├── KanbanBoard.tsx          # Main board with drag-and-drop columns
│   ├── KanbanColumn.tsx         # Droppable column with task list
│   ├── TaskCard.tsx             # Draggable task card
│   ├── TaskDetailModal.tsx      # Task details, deps, comments
│   ├── CreateTaskModal.tsx      # Form modal to create tasks (Zod validated)
│   ├── BoardSwitcher.tsx        # Board selection dropdown
│   ├── BoardHeader.tsx          # Board stats, team avatars, filters
│   ├── DependencyArrows.tsx     # SVG arrow overlay for dependency lines
│   ├── DependencyFlowView.tsx   # Hierarchical dependency flow diagram
│   ├── TeamManagementModal.tsx  # Invite & manage team members
│   ├── NotificationsDropdown.tsx# Bell icon dropdown with notification list
│   ├── PendingInvitesModal.tsx  # Accept/reject board invitations
│   └── ui/                      # 48 shadcn/ui primitives (button, dialog, etc.)
├── hooks/
│   ├── useAuth.tsx              # Auth context (sign up, sign in, sign out)
│   ├── useBoard.ts              # Board/column/task/dependency CRUD & state
│   ├── useNotifications.ts      # Realtime notification subscriptions
│   ├── useBoardMembers.ts       # Board members & pending invites
│   ├── usePendingInvites.ts     # Invitation accept/reject
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
├── data/
│   └── initialData.ts           # Default board with sample tasks
├── types/
│   └── kanban.ts                # Task, Column, Board, DependencyLine interfaces
└── pages/
    ├── Auth.tsx                 # Login / signup (Zod validated)
    ├── Index.tsx                # Main board view (protected)
    ├── DependencyView.tsx       # Dependency flow diagram (protected)
    └── NotFound.tsx             # 404 page
```

---

## 🗺 Routes

| Path | Access | Page | Description |
|------|--------|------|-------------|
| `/auth` | Public | Auth | Login / signup (redirects to `/` if already authenticated) |
| `/` | Protected | Index | Main Kanban board view |
| `/dependencies` | Protected | DependencyView | Visual task dependency flow diagram |
| `*` | Public | NotFound | 404 page |

---

## 🗄 Database Schema (Supabase)

### Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User display names & avatars (auto-created on signup) |
| `boards` | Project boards owned by users |
| `columns` | Kanban columns belonging to a board |
| `tasks` | Tasks within columns (title, description, assignee, due date, icon) |
| `task_dependencies` | Links between tasks (task A depends on task B) |
| `comments` | Comments on tasks |
| `notifications` | User notifications (task created/moved, comments, member joined) |
| `board_members` | Team membership with roles per board |
| `board_invites` | Pending email invitations (expire after 7 days) |

### Custom Enum

- **`board_role`**: `viewer` | `editor` | `admin` | `owner`

### Key Functions

| Function | Purpose |
|----------|---------|
| `has_board_access(board, user, role)` | Checks if user has at least the given role |
| `can_edit_board(board, user)` | Shorthand for editor+ access |
| `can_manage_board(board, user)` | Shorthand for admin+ access |
| `accept_board_invite(invite)` | Accepts invite, adds user as member, deletes invite |

### Triggers

| Trigger | Event | Action |
|---------|-------|--------|
| `on_auth_user_created` | New user signup | Auto-creates profile |
| `update_*_updated_at` | Row update on 5 tables | Sets `updated_at = now()` |
| `on_task_update` | Task insert/move | Notifies board owner |
| `on_comment_created` | New comment | Notifies board owner |
| `on_member_joined` | New board member | Notifies board owner |

All tables have **Row Level Security** enabled with policies enforcing the role permission matrix above.

---

## ⚙ Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
```

Get these from your [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API.

---

## 🏃 Running Locally

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
