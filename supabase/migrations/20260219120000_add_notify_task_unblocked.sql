-- Trigger function: when a task moves to "Done", notify if dependent tasks become fully unblocked
CREATE OR REPLACE FUNCTION public.notify_task_unblocked()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dependent_task RECORD;
  blocking_count INT;
  board_owner_id UUID;
BEGIN
  -- Only act on column changes
  IF OLD.column_id = NEW.column_id THEN
    RETURN NEW;
  END IF;

  -- Check if the new column is "Done"
  IF NOT EXISTS (
    SELECT 1 FROM columns WHERE id = NEW.column_id AND LOWER(title) = 'done'
  ) THEN
    RETURN NEW;
  END IF;

  -- Find all tasks that depend on this now-completed task
  FOR dependent_task IN
    SELECT t.id, t.title, t.column_id
    FROM task_dependencies td
    JOIN tasks t ON t.id = td.task_id
    WHERE td.depends_on_task_id = NEW.id
  LOOP
    -- Skip if the dependent task is already in a "Done" column
    IF EXISTS (
      SELECT 1 FROM columns WHERE id = dependent_task.column_id AND LOWER(title) = 'done'
    ) THEN
      CONTINUE;
    END IF;

    -- Count remaining non-done blocking dependencies for this dependent task
    SELECT COUNT(*) INTO blocking_count
    FROM task_dependencies td
    JOIN tasks dep_task ON dep_task.id = td.depends_on_task_id
    JOIN columns col ON dep_task.column_id = col.id
    WHERE td.task_id = dependent_task.id
      AND LOWER(col.title) != 'done';

    -- If zero remaining blockers, the task is fully unblocked
    IF blocking_count = 0 THEN
      SELECT b.owner_id INTO board_owner_id
      FROM columns c
      JOIN boards b ON c.board_id = b.id
      WHERE c.id = dependent_task.column_id;

      INSERT INTO notifications (user_id, type, title, message, task_id)
      VALUES (
        board_owner_id,
        'task_unblocked',
        'Task Unblocked',
        'Task "' || dependent_task.title || '" is now unblocked and ready to work on',
        dependent_task.id
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_task_unblocked
AFTER UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.notify_task_unblocked();

-- Trigger function: when a dependency is removed, notify if the task becomes fully unblocked
CREATE OR REPLACE FUNCTION public.notify_dependency_removed_unblock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining_blockers INT;
  unblocked_task RECORD;
  board_owner_id UUID;
BEGIN
  -- Check if the task still exists (might be a cascade delete)
  SELECT t.id, t.title, t.column_id INTO unblocked_task
  FROM tasks t WHERE t.id = OLD.task_id;

  IF unblocked_task IS NULL THEN
    RETURN OLD;
  END IF;

  -- Skip if the task is already in "Done"
  IF EXISTS (
    SELECT 1 FROM columns WHERE id = unblocked_task.column_id AND LOWER(title) = 'done'
  ) THEN
    RETURN OLD;
  END IF;

  -- Count remaining non-done blocking dependencies
  SELECT COUNT(*) INTO remaining_blockers
  FROM task_dependencies td
  JOIN tasks dep_task ON dep_task.id = td.depends_on_task_id
  JOIN columns col ON dep_task.column_id = col.id
  WHERE td.task_id = OLD.task_id
    AND LOWER(col.title) != 'done';

  -- If zero remaining blockers, task is fully unblocked
  IF remaining_blockers = 0 THEN
    SELECT b.owner_id INTO board_owner_id
    FROM columns c
    JOIN boards b ON c.board_id = b.id
    WHERE c.id = unblocked_task.column_id;

    INSERT INTO notifications (user_id, type, title, message, task_id)
    VALUES (
      board_owner_id,
      'task_unblocked',
      'Task Unblocked',
      'Task "' || unblocked_task.title || '" is now unblocked and ready to work on',
      unblocked_task.id
    );
  END IF;

  RETURN OLD;
END;
$$;

CREATE TRIGGER on_dependency_removed_unblock
AFTER DELETE ON public.task_dependencies
FOR EACH ROW
EXECUTE FUNCTION public.notify_dependency_removed_unblock();
