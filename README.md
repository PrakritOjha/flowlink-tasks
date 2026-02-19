# TaskLink — Collaborative Kanban Project Manager

A full-stack collaborative project management app built with React, TypeScript, and Lovable Cloud.

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
| Backend | Lovable Cloud (Postgres, Auth, RLS, Realtime) |
| Drag & Drop | @hello-pangea/dnd |
| State | React hooks + realtime subscriptions |
| Routing | react-router-dom |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── KanbanBoard.tsx          # Main board with drag-and-drop
│   ├── KanbanColumn.tsx         # Column with task list
│   ├── TaskCard.tsx             # Individual task card
│   ├── TaskDetailModal.tsx      # Task details, deps, comments
│   ├── BoardSwitcher.tsx        # Board selection dropdown
│   ├── BoardHeader.tsx          # Board stats and team avatars
│   ├── TeamManagementModal.tsx  # Invite & manage team members
│   ├── NotificationsDropdown.tsx
│   ├── PendingInvitesModal.tsx
│   └── CreateTaskModal.tsx
├── hooks/
│   ├── useAuth.tsx              # Authentication context
│   ├── useBoard.ts              # Board data management
│   ├── useNotifications.ts      # Real-time notifications
│   ├── useBoardMembers.ts       # Team member management
│   └── usePendingInvites.ts     # Invitation handling
├── lib/database/
│   ├── comments.ts              # Comments CRUD
│   ├── notifications.ts         # Notifications CRUD
│   └── members.ts               # Team members CRUD
└── pages/
    ├── Auth.tsx                 # Login / signup
    ├── Index.tsx                # Main board view
    └── DependencyView.tsx       # Dependency flow diagram
```

---

## 🏃 Running Locally

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install
npm run dev
```
