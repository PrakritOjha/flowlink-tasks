# TaskLink — User Flow

## Quick Summary

- Owner signs up → gets a default board
- Owner invites teammates by email → they sign up with that email → auto-joined as editor
- Notifications go to ALL board members, not just the owner
- Only owners can create/rename/delete boards
- Each user sees their role badge (Owner, Editor, Viewer) on the board

---

## Flow

### 1. Owner Signs Up
- Signs up at `/auth` with display name, email, password
- Lands on `/board` → a default "My First Board" is auto-created with 3 columns (To Do, In Progress, Done)

### 2. Owner Invites a Teammate
- Clicks the team button → opens Team Management modal
- Enters teammate's email → clicks Invite → invite saved with role `editor` (7-day expiry)
- **No email is sent** — tell the person to sign up with that email

### 3. Teammate Signs Up
- Signs up at `/auth` with the **same email** that was invited
- Auto-accept runs → matched by email → added to board as editor
- No junk "My First Board" created (membership check prevents it)
- Lands directly on the invited board

### 4. What Each Role Sees

| Action | Owner | Editor | Viewer |
|---|---|---|---|
| View board & tasks | Yes | Yes | Yes |
| Create/edit/move tasks | Yes | Yes | No |
| Create new board | Yes | No | No |
| Rename/delete board | Yes | No | No |
| Invite members | Yes | No | No |
| Role badge shown | "Owner" (amber) | "Editor" (green) | "Viewer" (blue) |

### 5. Notifications
- When someone creates a task, moves a task, comments, or a task gets unblocked → **every board member + owner gets notified** (except the person who did it)
- Notifications appear in the bell icon in real-time

---

## Example: Solitude (owner) + Anish (editor)

### Setup
1. **Solitude** signs up → board "Sprint 1" auto-created with columns: To Do, In Progress, Done
2. Solitude opens Team Management → invites `anish@example.com` as editor
3. **Anish** signs up with `anish@example.com` → auto-joined to "Sprint 1" as editor

### Creating Tasks with Dependencies

**Solitude** creates 3 tasks in "To Do":

| Task | Assigned To | Depends On |
|---|---|---|
| Design API schema | Solitude | — |
| Build backend endpoints | Anish | Design API schema |
| Write frontend integration | Anish | Build backend endpoints |

- "Build backend endpoints" is **blocked** — can't start until "Design API schema" is done
- "Write frontend integration" is **blocked** — can't start until "Build backend endpoints" is done

### The Work Happens

1. **Solitude** drags "Design API schema" to **Done**
   - "Build backend endpoints" becomes **unblocked**
   - Anish gets notification: *"Task 'Build backend endpoints' is now unblocked"*
   - Solitude does NOT get this notification (he's the one who did it)

2. **Anish** drags "Build backend endpoints" to **In Progress**
   - Solitude gets notification: *"Task 'Build backend endpoints' was moved"*

3. **Anish** adds a comment on "Build backend endpoints": "API is ready for review"
   - Solitude gets notification: *"Anish commented on 'Build backend endpoints'"*

4. **Anish** drags "Build backend endpoints" to **Done**
   - "Write frontend integration" becomes **unblocked**
   - Solitude gets notification: *"Task 'Write frontend integration' is now unblocked"*
   - Anish does NOT get this notification (he's the one who did it)

### What Each Person Sees

**Solitude (Owner):**
- Role badge: "Owner" (amber with crown icon)
- Can rename/delete "Sprint 1"
- Can create new boards
- Can invite/remove members
- Sees `...` menu on board header

**Anish (Editor):**
- Role badge: "Editor" (green with pencil icon)
- Can create tasks, move tasks, add comments
- Cannot rename/delete "Sprint 1"
- Cannot create new boards
- No `...` menu visible
- No "Create new board" in board switcher

---

## Migrations to Apply

```sh
supabase db push
```

1. `20260226120000_fix_notification_triggers_all_members.sql` — notifications go to all members
2. `20260226130000_cleanup_junk_boards.sql` — deletes auto-created junk boards for coresuite/sccout
