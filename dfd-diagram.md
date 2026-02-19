# TaskLink Data Flow Diagrams

---

## DFD Level 0 -- Context Diagram

```mermaid
flowchart LR
    Member["Team Member"]

    Member -- "Login and Signup" --> TL
    Member -- "Task Operations and Comments" --> TL
    TL -- "Board and Task Data" --> Member
    TL -- "Real-time Notifications" --> Member

    TL["0 - TaskLink Platform"]

    Owner["Board Owner"]

    Owner -- "Create Board and Invite Members" --> TL
    TL -- "Member Join Notifications" --> Owner
    Owner -- "Manage Board and Assign Tasks" --> TL
    TL -- "Board Data and Team Status" --> Owner
```

---

## DFD Level 1

```mermaid
flowchart TD
    User["User"]

    User -- "Login and Signup" --> P1
    P1 -- "Access Granted" --> User

    P1["1.0 User Authentication"]

    P1 -- "Store user data" --> D1
    D1 -- "User Record" --> P1

    D1[("D1  |  User Data")]

    User -- "Search Tasks" --> P2
    P2 -- "Task List" --> User

    P2["2.0 Board and Task Management"]

    P2 -- "Request data" --> D2
    D2 -- "Response data" --> P2

    D2[("D2  |  Board Data")]

    User -- "Accept Invite" --> P3

    P3["3.0 Invite Processing"]

    P3 -- "Invite data" --> D1
    D1 -- "Member data" --> P3

    User -- "View Comments" --> P4

    P4["4.0 Comments and Notifications"]

    P4 -- "Response data" --> D2

    P4 -- "Real-time Notifications" --> User

    Owner["Board Owner"]

    Owner -- "Create and Edit" --> P2
    Owner -- "Delete" --> P2

    Owner -- "Send Invite" --> P3
    Owner -- "Remove Member" --> P3

    Owner -- "Add Comment" --> P4
```

---

## Data Dictionary

| ID | Data Store | Tables |
|---|---|---|
| D1 | User Data | profiles, board_members, board_invites |
| D2 | Board Data | boards, columns, tasks, task_dependencies, comments, notifications |

## Process Summary

| Process | Description |
|---|---|
| 1.0 User Authentication | Handles signup, login, session management; auto-creates profile via DB trigger |
| 2.0 Board and Task Management | Board CRUD, task CRUD, drag-and-drop moves, search and filter, dependencies |
| 3.0 Invite Processing | Send invites by email, accept invites, remove members |
| 4.0 Comments and Notifications | Add and view comments on tasks; real-time notification delivery |
