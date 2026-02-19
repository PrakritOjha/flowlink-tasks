-- Add assignee_id column (nullable FK to auth.users)
ALTER TABLE tasks ADD COLUMN assignee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for efficient lookups
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
