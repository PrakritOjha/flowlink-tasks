-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Users can view comments on tasks in their boards
CREATE POLICY "Users can view comments in their boards" 
ON public.comments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM tasks t
  JOIN columns c ON t.column_id = c.id
  JOIN boards b ON c.board_id = b.id
  WHERE t.id = comments.task_id AND b.owner_id = auth.uid()
));

-- Users can create comments on tasks in their boards
CREATE POLICY "Users can create comments in their boards" 
ON public.comments 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN columns c ON t.column_id = c.id
    JOIN boards b ON c.board_id = b.id
    WHERE t.id = comments.task_id AND b.owner_id = auth.uid()
  )
);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" 
ON public.comments 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments" 
ON public.comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- System can create notifications (using service role or triggers)
CREATE POLICY "Allow insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger to update updated_at on comments
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to notify on task assignment
CREATE OR REPLACE FUNCTION public.notify_task_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  board_owner_id UUID;
  task_title TEXT;
BEGIN
  -- Get the board owner
  SELECT b.owner_id, NEW.title INTO board_owner_id, task_title
  FROM columns c
  JOIN boards b ON c.board_id = b.id
  WHERE c.id = NEW.column_id;

  -- Notify on task creation
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, type, title, message, task_id)
    VALUES (board_owner_id, 'task_created', 'New Task Created', 'Task "' || task_title || '" was created', NEW.id);
  END IF;

  -- Notify on task move (column change)
  IF TG_OP = 'UPDATE' AND OLD.column_id != NEW.column_id THEN
    INSERT INTO public.notifications (user_id, type, title, message, task_id)
    VALUES (board_owner_id, 'task_moved', 'Task Moved', 'Task "' || task_title || '" was moved to a new column', NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for task notifications
CREATE TRIGGER on_task_update
AFTER INSERT OR UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.notify_task_update();

-- Create function to notify on comment
CREATE OR REPLACE FUNCTION public.notify_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  board_owner_id UUID;
  task_title TEXT;
  commenter_name TEXT;
BEGIN
  -- Get the board owner and task title
  SELECT b.owner_id, t.title INTO board_owner_id, task_title
  FROM tasks t
  JOIN columns c ON t.column_id = c.id
  JOIN boards b ON c.board_id = b.id
  WHERE t.id = NEW.task_id;

  -- Get commenter name
  SELECT COALESCE(display_name, 'Someone') INTO commenter_name
  FROM profiles WHERE user_id = NEW.user_id;

  -- Don't notify yourself
  IF board_owner_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, message, task_id)
    VALUES (board_owner_id, 'comment', 'New Comment', commenter_name || ' commented on "' || task_title || '"', NEW.task_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for comment notifications
CREATE TRIGGER on_comment_created
AFTER INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_comment();