# TaskLink Entity-Relationship Diagram

## E-R Diagram (Mermaid)

```mermaid
erDiagram
    AUTH_USERS {
        uuid id PK
        string email
        jsonb raw_user_meta_data
        timestamp created_at
    }

    PROFILES {
        uuid id PK
        uuid user_id FK "UNIQUE, references auth.users"
        string display_name
        string avatar_url
        timestamp created_at
        timestamp updated_at
    }

    BOARDS {
        uuid id PK
        string name "NOT NULL"
        text description
        uuid owner_id FK "references auth.users"
        timestamp created_at
        timestamp updated_at
    }

    COLUMNS {
        uuid id PK
        uuid board_id FK "references boards, ON DELETE CASCADE"
        string title "NOT NULL"
        integer position "NOT NULL, default 0"
        timestamp created_at
    }

    TASKS {
        uuid id PK
        uuid column_id FK "references columns, ON DELETE CASCADE"
        string title "NOT NULL"
        text description
        string assignee_name
        uuid assignee_id FK "references auth.users, ON DELETE SET NULL"
        date due_date
        string icon "default 'planning'"
        integer position "NOT NULL, default 0"
        timestamp created_at
        timestamp updated_at
    }

    TASK_DEPENDENCIES {
        uuid id PK
        uuid task_id FK "references tasks, ON DELETE CASCADE"
        uuid depends_on_task_id FK "references tasks, ON DELETE CASCADE"
        timestamp created_at
    }

    COMMENTS {
        uuid id PK
        uuid task_id FK "references tasks, ON DELETE CASCADE"
        uuid user_id FK "references auth.users"
        text content "NOT NULL"
        timestamp created_at
        timestamp updated_at
    }

    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK "references auth.users"
        string type "NOT NULL"
        string title "NOT NULL"
        text message
        uuid task_id FK "references tasks, ON DELETE CASCADE, nullable"
        boolean read "default false"
        timestamp created_at
    }

    BOARD_MEMBERS {
        uuid id PK
        uuid board_id FK "references boards, ON DELETE CASCADE"
        uuid user_id FK "references auth.users"
        string role "always 'editor'"
        timestamp created_at
        timestamp updated_at
    }

    BOARD_INVITES {
        uuid id PK
        uuid board_id FK "references boards, ON DELETE CASCADE"
        string email "NOT NULL"
        string role "always 'editor'"
        uuid invited_by FK "references auth.users"
        timestamp created_at
        timestamp expires_at "default now() + 7 days"
    }

    %% Relationships

    AUTH_USERS ||--|| PROFILES : "has one (auto-created on signup)"
    AUTH_USERS ||--o{ BOARDS : "owns"
    AUTH_USERS ||--o{ COMMENTS : "writes"
    AUTH_USERS ||--o{ NOTIFICATIONS : "receives"
    AUTH_USERS ||--o{ BOARD_MEMBERS : "is editor on boards"
    AUTH_USERS ||--o{ BOARD_INVITES : "invites others"
    AUTH_USERS ||--o{ TASKS : "assigned to (optional)"

    BOARDS ||--o{ COLUMNS : "contains"
    BOARDS ||--o{ BOARD_MEMBERS : "has editors"
    BOARDS ||--o{ BOARD_INVITES : "has pending invites"

    COLUMNS ||--o{ TASKS : "contains"

    TASKS ||--o{ TASK_DEPENDENCIES : "has dependencies (as dependent)"
    TASKS ||--o{ TASK_DEPENDENCIES : "is depended upon (as blocker)"
    TASKS ||--o{ COMMENTS : "has"
    TASKS ||--o{ NOTIFICATIONS : "related to (optional)"
```

---

## Entity Descriptions

### AUTH_USERS (Supabase managed)
The authentication table managed by Supabase Auth. Stores user credentials and metadata. All other user references point here via foreign keys.

### PROFILES
Extended user information auto-created via a database trigger (`handle_new_user`) when a user signs up. Stores display name and avatar URL. One-to-one relationship with `auth.users`.

### BOARDS
Project boards that serve as the top-level organizational unit. Each board is owned by one user (tracked via `owner_id`). The owner has full control including inviting/removing members and deleting the board. Deleting a board cascades to all its columns, tasks, dependencies, comments, members, and invites.

### COLUMNS
Kanban columns within a board. Every new board starts with three default columns: **To Do** (position 0), **In Progress** (position 1), **Done** (position 2). Ordered by `position`.

### TASKS
Individual task cards within columns. Each task belongs to exactly one column and has a title, optional description, optional assignee (both name and user reference), optional due date, a category icon, and a position for ordering within the column. Cascade-deleted when the parent column is deleted.

### TASK_DEPENDENCIES
Many-to-many self-referencing relationship on tasks. Represents "Task A depends on Task B" (i.e., Task A is blocked by Task B). Has a unique constraint on `(task_id, depends_on_task_id)` and a check constraint preventing self-references (`task_id != depends_on_task_id`).

### COMMENTS
Discussion thread on tasks. Each comment is tied to a task and the user who wrote it. Comments are cascade-deleted when the parent task is removed.

### NOTIFICATIONS
System-generated alerts for users. Types include: `task_created`, `task_moved`, `task_unblocked`, `comment`, `member_joined`. Created by database triggers, delivered in real-time via Supabase Realtime subscriptions.

### BOARD_MEMBERS
Join table for board collaboration. Links a user to a board as an **editor**. All invited members get the same editor role -- there is no role hierarchy in this table. The board owner is identified separately via `boards.owner_id`. Unique constraint on `(board_id, user_id)`.

### BOARD_INVITES
Pending invitations to join a board. Stores the invitee's email (not user ID, since they may not have signed up yet), the role (always `editor`), who sent the invite, and a 7-day expiry timestamp. Unique constraint on `(board_id, email)`. Accepted via the `accept_board_invite` RPC function which atomically creates a `board_members` row and deletes the invite.

---

## Constraints & Triggers Summary

| Constraint / Trigger | Table | Description |
|---|---|---|
| `UNIQUE(user_id)` | profiles | One profile per auth user |
| `UNIQUE(board_id, user_id)` | board_members | User can only be a member once per board |
| `UNIQUE(board_id, email)` | board_invites | One active invite per email per board |
| `UNIQUE(task_id, depends_on_task_id)` | task_dependencies | No duplicate dependencies |
| `CHECK(task_id != depends_on_task_id)` | task_dependencies | No self-references |
| `ON DELETE CASCADE` | columns, tasks, task_dependencies, comments, notifications, board_members, board_invites | Parent deletion cascades to children |
| `ON DELETE SET NULL` | tasks.assignee_id | User deletion unassigns but keeps task |
| `handle_new_user()` | auth.users (trigger) | Auto-creates profile on signup |
| `update_updated_at_column()` | profiles, boards, tasks, comments, board_members (trigger) | Keeps updated_at current |
| `notify_task_update()` | tasks (trigger) | Fires task_created / task_moved notifications |
| `notify_comment()` | comments (trigger) | Fires comment notification to board owner |
| `notify_member_joined()` | board_members (trigger) | Fires member_joined notification to board owner |
| `notify_task_unblocked()` | tasks (trigger) | Fires task_unblocked when a task moves to Done |
| `notify_dependency_removed_unblock()` | task_dependencies (trigger) | Fires task_unblocked when a dependency is deleted |

---

## Access Model

```mermaid
flowchart LR
    O[Owner] --- |"identified by boards.owner_id"| B[Board]
    E[Editor] --- |"row in board_members"| B

    O -.- OPerms["Full control: tasks, deps, comments,\ninvite/remove members, rename/delete board"]
    E -.- EPerms["Create/edit/move/delete tasks,\nmanage dependencies, add comments"]
```

- **Owner**: The board creator. Identified by `boards.owner_id`. Has full control over the board including inviting members, removing members, renaming, and deleting the board.
- **Editor**: All invited members. Stored in `board_members` with `role = 'editor'`. Can create, edit, move, and delete tasks; manage dependencies; and add comments.

RLS is enforced via helper functions:
- `has_board_access(board_id, user_id, min_role)` -- checks if user has at least the given role
- `can_edit_board(board_id, user_id)` -- shortcut for editor access
