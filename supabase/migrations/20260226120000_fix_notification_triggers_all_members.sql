-- Helper function: notify all board members (+ owner) except the actor
CREATE OR REPLACE FUNCTION public.notify_board_members(
  _board_id UUID,
  _actor_id UUID,
  _type TEXT,
  _title TEXT,
  _message TEXT,
  _task_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _recipient_id UUID;
BEGIN
  -- Notify the board owner (if not the actor)
  SELECT owner_id INTO _recipient_id FROM boards WHERE id = _board_id;
  IF _recipient_id IS NOT NULL AND _recipient_id != _actor_id THEN
    INSERT INTO notifications (user_id, type, title, message, task_id)
    VALUES (_recipient_id, _type, _title, _message, _task_id);
  END IF;

  -- Notify all board members (except the actor)
  FOR _recipient_id IN
    SELECT user_id FROM board_members
    WHERE board_id = _board_id AND user_id != _actor_id
  LOOP
    INSERT INTO notifications (user_id, type, title, message, task_id)
    VALUES (_recipient_id, _type, _title, _message, _task_id);
  END LOOP;
END;
$$;

-- 1) notify_task_update — task created / task moved
CREATE OR REPLACE FUNCTION public.notify_task_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _board_id UUID;
  task_title TEXT;
  _actor_id UUID;
BEGIN
  _actor_id := auth.uid();

  SELECT b.id, NEW.title INTO _board_id, task_title
  FROM columns c
  JOIN boards b ON c.board_id = b.id
  WHERE c.id = NEW.column_id;

  IF TG_OP = 'INSERT' THEN
    PERFORM notify_board_members(
      _board_id, _actor_id,
      'task_created', 'New Task Created',
      'Task "' || task_title || '" was created',
      NEW.id
    );
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.column_id != NEW.column_id THEN
    PERFORM notify_board_members(
      _board_id, _actor_id,
      'task_moved', 'Task Moved',
      'Task "' || task_title || '" was moved to a new column',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 2) notify_comment — new comment on task
CREATE OR REPLACE FUNCTION public.notify_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _board_id UUID;
  task_title TEXT;
  commenter_name TEXT;
BEGIN
  SELECT b.id, t.title INTO _board_id, task_title
  FROM tasks t
  JOIN columns c ON t.column_id = c.id
  JOIN boards b ON c.board_id = b.id
  WHERE t.id = NEW.task_id;

  SELECT COALESCE(display_name, 'Someone') INTO commenter_name
  FROM profiles WHERE user_id = NEW.user_id;

  PERFORM notify_board_members(
    _board_id, NEW.user_id,
    'comment', 'New Comment',
    commenter_name || ' commented on "' || task_title || '"',
    NEW.task_id
  );

  RETURN NEW;
END;
$$;

-- 3) notify_member_joined — new member joined board
CREATE OR REPLACE FUNCTION public.notify_member_joined()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _board_id UUID;
  board_name TEXT;
  member_name TEXT;
BEGIN
  _board_id := NEW.board_id;

  SELECT name INTO board_name FROM boards WHERE id = _board_id;

  SELECT COALESCE(display_name, 'A team member') INTO member_name
  FROM profiles WHERE user_id = NEW.user_id;

  PERFORM notify_board_members(
    _board_id, NEW.user_id,
    'member_joined', 'New Team Member',
    member_name || ' joined "' || board_name || '"',
    NULL
  );

  RETURN NEW;
END;
$$;

-- 4) notify_task_unblocked — task fully unblocked after dep moved to Done
CREATE OR REPLACE FUNCTION public.notify_task_unblocked()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dependent_task RECORD;
  blocking_count INT;
  _board_id UUID;
  _actor_id UUID;
BEGIN
  IF OLD.column_id = NEW.column_id THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM columns WHERE id = NEW.column_id AND LOWER(title) = 'done'
  ) THEN
    RETURN NEW;
  END IF;

  _actor_id := auth.uid();

  FOR dependent_task IN
    SELECT t.id, t.title, t.column_id
    FROM task_dependencies td
    JOIN tasks t ON t.id = td.task_id
    WHERE td.depends_on_task_id = NEW.id
  LOOP
    IF EXISTS (
      SELECT 1 FROM columns WHERE id = dependent_task.column_id AND LOWER(title) = 'done'
    ) THEN
      CONTINUE;
    END IF;

    SELECT COUNT(*) INTO blocking_count
    FROM task_dependencies td
    JOIN tasks dep_task ON dep_task.id = td.depends_on_task_id
    JOIN columns col ON dep_task.column_id = col.id
    WHERE td.task_id = dependent_task.id
      AND LOWER(col.title) != 'done';

    IF blocking_count = 0 THEN
      SELECT b.id INTO _board_id
      FROM columns c
      JOIN boards b ON c.board_id = b.id
      WHERE c.id = dependent_task.column_id;

      PERFORM notify_board_members(
        _board_id, _actor_id,
        'task_unblocked', 'Task Unblocked',
        'Task "' || dependent_task.title || '" is now unblocked and ready to work on',
        dependent_task.id
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- 5) notify_dependency_removed_unblock — dep removed, task may be unblocked
CREATE OR REPLACE FUNCTION public.notify_dependency_removed_unblock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining_blockers INT;
  unblocked_task RECORD;
  _board_id UUID;
  _actor_id UUID;
BEGIN
  SELECT t.id, t.title, t.column_id INTO unblocked_task
  FROM tasks t WHERE t.id = OLD.task_id;

  IF unblocked_task IS NULL THEN
    RETURN OLD;
  END IF;

  IF EXISTS (
    SELECT 1 FROM columns WHERE id = unblocked_task.column_id AND LOWER(title) = 'done'
  ) THEN
    RETURN OLD;
  END IF;

  SELECT COUNT(*) INTO remaining_blockers
  FROM task_dependencies td
  JOIN tasks dep_task ON dep_task.id = td.depends_on_task_id
  JOIN columns col ON dep_task.column_id = col.id
  WHERE td.task_id = OLD.task_id
    AND LOWER(col.title) != 'done';

  IF remaining_blockers = 0 THEN
    _actor_id := auth.uid();

    SELECT b.id INTO _board_id
    FROM columns c
    JOIN boards b ON c.board_id = b.id
    WHERE c.id = unblocked_task.column_id;

    PERFORM notify_board_members(
      _board_id, _actor_id,
      'task_unblocked', 'Task Unblocked',
      'Task "' || unblocked_task.title || '" is now unblocked and ready to work on',
      unblocked_task.id
    );
  END IF;

  RETURN OLD;
END;
$$;
