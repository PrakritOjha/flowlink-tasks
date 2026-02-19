# TaskLink Architecture

---

## High-Level System Architecture

```mermaid
flowchart TD
    subgraph Frontend ["Frontend - Browser"]
        React["React 18 + TypeScript"]
        Tailwind["Tailwind CSS + shadcn UI"]
        DnD["Drag and Drop - hello-pangea dnd"]
        Graph["Dependency Graph - ReactFlow + dagre"]
    end

    subgraph Hooks ["State Layer"]
        AuthCtx["Auth Context"]
        BoardCtx["Board Context"]
        Notify["Realtime Notifications"]
    end

    subgraph DBLayer ["Database Layer"]
        Queries["database.ts - All Supabase Queries"]
    end

    subgraph Supabase ["Supabase Backend"]
        Auth["Auth - Email and Password"]
        Postgres["PostgreSQL - 9 Tables with RLS"]
        RT["Realtime - WebSocket"]
        Triggers["DB Triggers"]
    end

    React --> AuthCtx
    React --> BoardCtx
    AuthCtx --> Queries
    BoardCtx --> Queries
    RT --> Notify
    Notify --> BoardCtx
    Queries --> Auth
    Queries --> Postgres
    Postgres --> Triggers
    Triggers --> RT
```

---

## Request Flow

```mermaid
sequenceDiagram
    participant U as User
    participant R as React App
    participant H as Hooks
    participant D as Database Layer
    participant S as Supabase

    U->>R: Interacts with UI
    R->>H: Calls hook method
    H->>D: Calls database function
    D->>S: Supabase client query
    S-->>D: Query result
    D-->>H: Parsed data
    H-->>R: State update
    R-->>U: Re-render UI

    Note over S: DB trigger fires
    S-->>H: Realtime event
    H-->>R: Notification update
    R-->>U: Bell icon badge updates
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| UI | React 18 + TypeScript | Component-based SPA |
| Styling | Tailwind CSS + shadcn UI | Utility CSS and prebuilt components |
| Routing | react-router-dom v6 | Client-side navigation |
| Forms | react-hook-form + Zod | Validation |
| Drag and Drop | hello-pangea dnd | Kanban task reordering |
| Graph | ReactFlow + dagre | Dependency visualization |
| Auth | Supabase Auth | Email and password, JWT |
| Database | Supabase PostgreSQL | 9 tables with RLS |
| Realtime | Supabase Realtime | Live notifications |
| Build | Vite | Dev server and production builds |

---

## Database Tables

```mermaid
flowchart LR
    subgraph Users
        profiles
    end

    subgraph Boards
        boards
        columns
        board_members
        board_invites
    end

    subgraph Tasks
        tasks
        task_dependencies
        comments
    end

    subgraph System
        notifications
    end

    profiles --- boards
    boards --- columns
    columns --- tasks
    tasks --- task_dependencies
    tasks --- comments
    tasks --- notifications
    boards --- board_members
    boards --- board_invites
```

---

## Folder Structure

```
src/
├── pages/           Auth, Board, Dependencies, Profile, Team
├── components/      Kanban, Modals, Header, Cards
│   └── ui/          shadcn UI primitives
├── hooks/           useAuth, useBoard, useNotifications
├── lib/             Database queries and utilities
│   └── database/    Comments, Members, Notifications
├── types/           TypeScript interfaces
└── integrations/    Supabase client and generated types
```
