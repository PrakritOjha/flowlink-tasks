# TaskLink User Flows

Detailed user flows for every feature in TaskLink, with Mermaid diagrams.

---

## 1. Authentication

### Sign Up

```mermaid
flowchart TD
    A[User visits /auth] --> B[Clicks 'Create account']
    B --> C[Enters display name, email, password, confirm password]
    C --> D[Submits form]
    D --> E{Validation passes?}
    E -- No --> F[Show Zod validation errors]
    F --> C
    E -- Yes --> G[Supabase creates auth user]
    G --> H[Trigger: auto-creates profile in profiles table]
    H --> I[Session stored in localStorage]
    I --> J[Redirect to / which navigates to /board/:boardId]
```

### Sign In

```mermaid
flowchart TD
    A[User visits /auth] --> B[Enters email & password]
    B --> C[Submits form]
    C --> D{Credentials valid?}
    D -- No --> E[Show error message]
    E --> B
    D -- Yes --> F[Session stored in localStorage]
    F --> G[Auto-accept any pending board invites]
    G --> H[Redirect to / which navigates to /board/:boardId]
```

### Sign Out

```mermaid
flowchart TD
    A[User clicks avatar in header] --> B[Clicks 'Sign out']
    B --> C[Session cleared from localStorage]
    C --> D[Redirect to /auth]
```

### Route Protection

```mermaid
flowchart TD
    A[User navigates to a route] --> B{Authenticated?}
    B -- No --> C{Is route public /auth?}
    C -- Yes --> D[Render Auth page]
    C -- No --> E[Redirect to /auth]
    B -- Yes --> F{Is route /auth?}
    F -- Yes --> G[Redirect to /]
    F -- No --> H[Render protected page]
```

---

## 2. Board Management

### First-Time User / Default Board

```mermaid
flowchart TD
    A[User logs in for the first time] --> B[useBoard initializes]
    B --> C[Auto-accept pending invites]
    C --> D[Fetch all boards]
    D --> E{Any boards exist?}
    E -- No --> F[Create default board: 'My First Board']
    F --> G[Default columns: To Do, In Progress, Done]
    G --> H[Navigate to /board/:newBoardId]
    E -- Yes --> I[Navigate to /board/:firstBoardId]
```

### Create a Board

```mermaid
flowchart TD
    A[Click board name dropdown - BoardSwitcher] --> B[Click 'Create new board']
    B --> C[Enter board name required & optional description]
    C --> D[Submit]
    D --> E[Board created in DB with user as owner]
    E --> F[Default columns created - To Do, In Progress, Done]
    F --> G[Board switcher updates, new board selected]
    G --> H[Navigate to /board/:newBoardId]
```

### Switch Boards

```mermaid
flowchart TD
    A[Click board name dropdown] --> B[See list of owned + shared boards]
    B --> C[Click a board]
    C --> D[switchBoard navigates to /board/:selectedBoardId]
    D --> E[useBoard loads columns, tasks, dependencies for selected board]
    E --> F[KanbanBoard re-renders with new data]
```

### Rename a Board

```mermaid
flowchart TD
    A[Click board actions dropdown in BoardHeader] --> B[Click 'Rename']
    B --> C[Confirmation dialog with input]
    C --> D[Enter new name]
    D --> E[updateBoard called]
    E --> F[Board name updates across header and switcher]
```

### Delete a Board

```mermaid
flowchart TD
    A[Click board actions dropdown in BoardHeader] --> B[Click 'Delete']
    B --> C[Confirmation dialog shown]
    C --> D{Confirm?}
    D -- Yes --> E[deleteBoard called]
    E --> F[Cascade deletes: columns, tasks, dependencies, comments, notifications]
    F --> G[Navigate to next available board or create default]
    D -- No --> H[Dialog dismissed]
```

---

## 3. Task Management

### Create a Task

```mermaid
flowchart TD
    A[Click 'Add Task' in a column] --> B[CreateTaskModal opens with column pre-selected]
    B --> C[Fill in title, description, assignee, due date, category/icon, status column]
    C --> D[Submit form]
    D --> E{Zod validation passes?}
    E -- No --> F[Show validation errors inline]
    F --> C
    E -- Yes --> G[Task inserted into DB via createTask]
    G --> H[Trigger: notification sent to board owner - task_created]
    H --> I[Task appears in selected column]
```

### Move a Task - Drag & Drop

```mermaid
flowchart TD
    A[User grabs a TaskCard] --> B[Drags to another KanbanColumn]
    B --> C[Drops task]
    C --> D[onDragEnd fires in KanbanBoard]
    D --> E{Is task blocked?}
    E -- Yes --> F{Dragging to In Progress or Done?}
    F -- Yes --> G[Toast warning: 'Task is blocked by X, moving anyway']
    F -- No --> H[Continue silently]
    E -- No --> H
    G --> H
    H --> I{Same column reorder?}
    I -- Yes --> J[Update task position in DB]
    I -- No --> K[Update task column_id and position in DB]
    K --> L[Trigger: notification - task_moved]
    K --> M{Moved to Done?}
    M -- Yes --> N[Trigger: check & fire task_unblocked for dependents]
    J --> O[Board re-renders with updated order]
    L --> O
    N --> O
```

### Edit a Task

```mermaid
flowchart TD
    A[Click on a TaskCard] --> B[TaskDetailModal opens in view mode]
    B --> C[Click pencil icon in header]
    C --> D[Edit mode activates]
    D --> E[Modify title / description / assignee / due date / category]
    E --> F{Click Save or Cancel?}
    F -- Save --> G{Title not empty?}
    G -- Yes --> H[updateTask called with changed fields]
    H --> I[Toast: 'Task updated']
    I --> J[onTaskUpdate fires - board refreshes]
    J --> K[Modal returns to view mode with updated data]
    G -- No --> L[Save button disabled]
    F -- Cancel --> M[All edits discarded, revert to original values]
    M --> N[Modal returns to view mode]
```

### Delete a Task

```mermaid
flowchart TD
    A[Open TaskDetailModal] --> B[Click pencil icon to enter edit mode]
    B --> C[Click 'Delete' button - red destructive]
    C --> D[Button text changes to 'Confirm?']
    D --> E{Click 'Confirm?' again?}
    E -- Yes --> F[deleteTask called]
    F --> G[Cascade: dependencies and comments removed]
    G --> H[Toast: 'Task deleted']
    H --> I[Modal closes]
    I --> J[onTaskDelete fires - board refreshes, task removed from view]
    E -- No / Click elsewhere --> K[Confirm state resets on next open]
```

### Task Card Display

```mermaid
flowchart TD
    A[TaskCard renders] --> B{Is task blocked?}
    B -- Yes --> C[75% opacity + amber 'Blocked by N tasks' badge with ShieldAlert icon]
    B -- No --> D[Full opacity]
    C --> E[Show category accent border + icon]
    D --> E
    E --> F[Show title + description preview]
    F --> G{Has assignee?}
    G -- Yes --> H[Show assignee chip]
    G -- No --> I[Skip]
    H --> J{Has dependencies?}
    I --> J
    J -- Yes --> K[Show dependency count badge]
    J -- No --> L[Done rendering]
    K --> L
```

---

## 4. Task Dependencies

### Add a Dependency

```mermaid
flowchart TD
    A[Click on a task] --> B[TaskDetailModal opens]
    B --> C[Scroll to Dependencies section]
    C --> D[Select a task from dropdown - excludes self and existing deps]
    D --> E[Click + button]
    E --> F[Dependency row inserted into task_dependencies table]
    F --> G[refreshDependencies reloads all deps]
    G --> H[Board re-renders: blocked status recalculated]
```

### Remove a Dependency

```mermaid
flowchart TD
    A[Open TaskDetailModal] --> B[See listed dependencies as badges]
    B --> C[Click X on a dependency badge]
    C --> D[Dependency row deleted from DB]
    D --> E{Was this the last blocking dep?}
    E -- Yes --> F[Trigger: notify_dependency_removed_unblock fires task_unblocked notification]
    E -- No --> G[Skip notification]
    F --> H[refreshDependencies reloads - board updates]
    G --> H
```

### Dependency Flow View

```mermaid
flowchart TD
    A[Click 'Dependencies' in header nav] --> B[Navigate to /board/:boardId/dependencies]
    B --> C[DependencyFlowView loads all tasks & dependencies for current board]
    C --> D[dagre computes left-to-right DAG layout]
    D --> E[ReactFlow renders custom TaskFlowNode nodes]
    E --> F[Animated smoothstep edges connect dependent tasks]
    F --> G[Stats bar shows: Total Tasks / Dependencies / Blocking Tasks]
    G --> H{User hovers a node?}
    H -- Yes --> I[Connected edges highlight bright blue, others fade]
    H -- No --> J[All edges normal]
```

---

## 5. Comments

### Add a Comment

```mermaid
flowchart TD
    A[Click on a task] --> B[TaskDetailModal opens]
    B --> C[Comments loaded from DB on open]
    C --> D[Scroll to Comments section]
    D --> E[Type comment in textarea]
    E --> F[Click 'Send Comment']
    F --> G[Comment inserted into comments table with user_id]
    G --> H[Trigger: notification sent to board owner - comment type]
    H --> I[Comment appears in chronological list with relative timestamp]
    I --> J[Shows 'You' for own comments, 'Team member' for others]
```

---

## 6. Notifications

### Notification Triggers

```mermaid
flowchart TD
    A[Event occurs in the system] --> B{Event type?}
    B -- Task created --> C[DB trigger: notify_task_update - type task_created]
    B -- Task moved to new column --> D[DB trigger: notify_task_update - type task_moved]
    B -- Task moved to Done --> E[DB trigger: notify_task_unblocked - checks dependents]
    B -- Dependency removed --> F[DB trigger: notify_dependency_removed_unblock]
    B -- Comment added --> G[DB trigger: notify_comment]
    B -- Member joined board --> H[DB trigger: notify_member_joined]
    C --> I[Notification row inserted for board owner]
    D --> I
    E --> I
    F --> I
    G --> I
    H --> I
    I --> J[Supabase Realtime pushes to useNotifications via channel subscription]
    J --> K[Bell icon badge count updates in Header]
```

### Viewing & Clearing Notifications

```mermaid
flowchart TD
    A[User sees badge on bell icon - capped at 9+] --> B[Clicks bell icon]
    B --> C[NotificationsDropdown opens - ScrollArea]
    C --> D[View up to 50 most recent notifications, newest first]
    D --> E[Each notification shows type icon + title + message + relative time]
    E --> F{Unread?}
    F -- Yes --> G[Highlighted background + blue dot indicator]
    F -- No --> H[Normal background]
    G --> I{Action?}
    H --> I
    I -- Click notification --> J[markRead called, blue dot disappears]
    I -- Click 'Mark all read' --> K[markAllRead called, all notifications cleared]
    J --> L[Badge count decreases]
    K --> L
```

---

## 7. Team Collaboration

### Invite a Member (Owner)

```mermaid
flowchart TD
    A[Click + button next to team avatars in BoardHeader] --> B[TeamManagementModal opens]
    B --> C[Enter teammate's email]
    C --> D[Click invite button]
    D --> E[Invite row created in board_invites with role = editor]
    E --> F[Invite expires in 7 days]
    F --> G[Invite appears in pending invites list]
```

### Accept an Invitation (Invited User)

```mermaid
flowchart TD
    A[Invited user signs up / logs in] --> B{Auto-accept on login?}
    B -- Yes --> C[useBoard auto-accepts pending invites on initialization]
    C --> D[board_members row created with role = editor]
    D --> E[Board appears in board list immediately]
    B -- No / Manual --> F[Header shows mail icon with badge count]
    F --> G[Click mail icon]
    G --> H[PendingInvitesModal opens]
    H --> I[See board name, description, expiry]
    I --> J{Accept or let expire?}
    J -- Accept --> K[accept_board_invite RPC called]
    K --> L[board_members row created with role = editor]
    L --> M[Invite deleted from board_invites]
    M --> N[Trigger: notification to board owner - member_joined]
    N --> O[Shared board appears in user's board list]
    J -- Ignore --> P[Invite expires after 7 days and becomes invalid]
```

### Cancel an Invite (Owner)

```mermaid
flowchart TD
    A[Open TeamManagementModal] --> B[See list of pending invites]
    B --> C[Click cancel on an invite]
    C --> D[Invite deleted from board_invites]
    D --> E[Invite no longer appears in invited user's pending list]
```

### Manage Members (Owner)

```mermaid
flowchart TD
    A[Open TeamManagementModal or navigate to /board/:boardId/team] --> B[See list of current editors]
    B --> C{Action?}
    C -- Remove member --> D[Click remove button]
    D --> E[removeBoardMember called]
    E --> F[Member loses access to board immediately]
```

---

## 8. Access Control

### Two-Level Access Model

```mermaid
flowchart TD
    A[User interacts with a board] --> B{Is user the board owner?}
    B -- Yes --> C[Full access: all task ops + invite/remove members + rename/delete board]
    B -- No --> D{Is user in board_members?}
    D -- Yes --> E[Editor access: create/edit/move/delete tasks, dependencies, comments]
    D -- No --> F[No access - RLS blocks all queries]
```

### How Ownership Works

```mermaid
flowchart TD
    A[Board created] --> B[boards.owner_id = creator's user ID]
    B --> C[Owner identified by boards.owner_id - not board_members]
    C --> D[Owner can: invite, remove members, rename, delete board]

    E[User invited by email] --> F[accept_board_invite RPC runs]
    F --> G[board_members row created with role = editor]
    G --> H[Editor can: full task CRUD, deps, comments, drag and drop]
```

---

## 9. Search & Filter

### Search Tasks

```mermaid
flowchart TD
    A[User types in search input in Header] --> B[searchQuery state updates in BoardContext]
    B --> C[KanbanBoard filteredTasks useMemo recalculates]
    C --> D[Tasks filtered by title OR description - case insensitive]
    D --> E[Board re-renders showing only matching tasks across all columns]
```

### Filter Tasks

```mermaid
flowchart TD
    A[Click Filter button in BoardHeader] --> B[Filter popover opens]
    B --> C{Select filter type}
    C -- Assignee --> D[Choose: All / Unassigned / Specific member name]
    C -- Status --> E[Choose a column: To Do / In Progress / Done]
    D --> F[filterAssignee state updates in BoardContext]
    E --> G[filterStatus state updates in BoardContext]
    F --> H[KanbanBoard filteredTasks recalculates]
    G --> H
    H --> I[Active filter count badge shown on Filter button]
    I --> J[Active filter pills displayed inline]
    J --> K{Click X on a pill?}
    K -- Yes --> L[That filter cleared, tasks re-filtered]
    K -- No --> M[Filters remain active]
```

---

## 10. Profile Management

### View & Edit Profile

```mermaid
flowchart TD
    A[Click avatar in Header] --> B[Click 'Profile']
    B --> C[Navigate to /profile]
    C --> D[Profile page loads: avatar initials, display name, email]
    D --> E{Click 'Edit Profile'?}
    E -- Yes --> F[Display name input becomes editable]
    F --> G[Enter new name - Zod validated: 2-50 chars]
    G --> H[Click 'Save Changes']
    H --> I[Updates auth.users metadata AND profiles table]
    I --> J[Toast: 'Profile updated']
    J --> K[Profile page reflects new name]
    E -- No --> L[View only]
```

---

## 11. End-to-End Flow: New User Joins a Team

```mermaid
sequenceDiagram
    actor Owner as Board Owner
    actor User as New User
    participant App as TaskLink
    participant DB as Supabase

    Owner->>App: Open TeamManagementModal
    Owner->>App: Enter User's email
    Owner->>App: Click invite
    App->>DB: Insert into board_invites (role=editor, expires in 7 days)

    User->>App: Sign up at /auth
    App->>DB: Create auth user
    DB->>DB: Trigger: create profile in profiles table

    User->>App: Redirect to / after login
    App->>DB: useBoard init: auto-accept pending invites
    DB->>DB: accept_board_invite RPC runs
    DB->>DB: Insert board_member (role: editor)
    DB->>DB: Delete invite
    DB->>DB: Trigger: notify owner - member_joined

    App->>DB: Fetch all boards (owned + shared)
    App-->>User: Shared board now visible in board switcher

    User->>App: Select shared board
    User->>App: Create tasks, edit tasks, drag & drop (editor permissions)
    User->>App: Add comments on tasks
    DB->>DB: Trigger: notify owner - comment added
    Owner->>App: Bell icon shows new notification
```

---

## 12. End-to-End Flow: Task Lifecycle

```mermaid
sequenceDiagram
    actor User as Team Member
    participant Board as Kanban Board
    participant Modal as TaskDetailModal
    participant DB as Supabase

    User->>Board: Click 'Add Task' on To Do column
    Board->>Modal: CreateTaskModal opens (column pre-selected)
    User->>Modal: Fill title, description, assignee, due date, category
    User->>Modal: Submit
    Modal->>DB: createTask()
    DB->>DB: Trigger: task_created notification to owner
    DB-->>Board: Task appears in To Do

    User->>Board: Drag task from To Do to In Progress
    Board->>DB: moveTask(taskId, inProgressColumnId, position)
    DB->>DB: Trigger: task_moved notification

    User->>Board: Click task to open details
    Board->>Modal: TaskDetailModal opens (view mode)
    User->>Modal: Click pencil icon to edit
    User->>Modal: Update description and assignee
    User->>Modal: Click Save
    Modal->>DB: updateTask()
    DB-->>Board: Board refreshes with updated task

    User->>Board: Drag task from In Progress to Done
    Board->>DB: moveTask(taskId, doneColumnId, position)
    DB->>DB: Trigger: task_moved notification
    DB->>DB: Trigger: check dependents - fire task_unblocked if applicable
    DB-->>Board: Dependent tasks unblocked (amber badge removed)
```
