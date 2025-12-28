-- Create role enum for board members
CREATE TYPE public.board_role AS ENUM ('viewer', 'editor', 'admin', 'owner');

-- Create board_members table
CREATE TABLE public.board_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role board_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(board_id, user_id)
);

-- Create board_invites table for pending invitations
CREATE TABLE public.board_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role board_role NOT NULL DEFAULT 'editor',
  invited_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  UNIQUE(board_id, email)
);

-- Enable RLS
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_invites ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at on board_members
CREATE TRIGGER update_board_members_updated_at
BEFORE UPDATE ON public.board_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if user is board member with specific role or higher
CREATE OR REPLACE FUNCTION public.has_board_access(
  _board_id UUID,
  _user_id UUID,
  _min_role board_role DEFAULT 'viewer'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role board_role;
  is_owner BOOLEAN;
BEGIN
  -- Check if user is the board owner
  SELECT EXISTS(
    SELECT 1 FROM boards WHERE id = _board_id AND owner_id = _user_id
  ) INTO is_owner;
  
  IF is_owner THEN
    RETURN TRUE;
  END IF;
  
  -- Get user's role in board_members
  SELECT role INTO user_role
  FROM board_members
  WHERE board_id = _board_id AND user_id = _user_id;
  
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check role hierarchy (owner > admin > editor > viewer)
  RETURN CASE
    WHEN _min_role = 'viewer' THEN TRUE
    WHEN _min_role = 'editor' THEN user_role IN ('editor', 'admin', 'owner')
    WHEN _min_role = 'admin' THEN user_role IN ('admin', 'owner')
    WHEN _min_role = 'owner' THEN user_role = 'owner'
    ELSE FALSE
  END;
END;
$$;

-- Function to check if user can edit board (editor or higher)
CREATE OR REPLACE FUNCTION public.can_edit_board(_board_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_board_access(_board_id, _user_id, 'editor');
$$;

-- Function to check if user can manage board (admin or higher)
CREATE OR REPLACE FUNCTION public.can_manage_board(_board_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_board_access(_board_id, _user_id, 'admin');
$$;

-- Board Members RLS Policies
CREATE POLICY "Users can view members of boards they have access to"
ON public.board_members FOR SELECT
USING (public.has_board_access(board_id, auth.uid(), 'viewer'));

CREATE POLICY "Admins can add members to their boards"
ON public.board_members FOR INSERT
WITH CHECK (public.can_manage_board(board_id, auth.uid()));

CREATE POLICY "Admins can update member roles"
ON public.board_members FOR UPDATE
USING (public.can_manage_board(board_id, auth.uid()));

CREATE POLICY "Admins can remove members"
ON public.board_members FOR DELETE
USING (public.can_manage_board(board_id, auth.uid()));

-- Board Invites RLS Policies
CREATE POLICY "Users can view invites for boards they manage"
ON public.board_invites FOR SELECT
USING (public.can_manage_board(board_id, auth.uid()) OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admins can create invites"
ON public.board_invites FOR INSERT
WITH CHECK (public.can_manage_board(board_id, auth.uid()));

CREATE POLICY "Admins can delete invites"
ON public.board_invites FOR DELETE
USING (public.can_manage_board(board_id, auth.uid()));

-- Update existing boards RLS to include team members
DROP POLICY IF EXISTS "Users can view their own boards" ON public.boards;
CREATE POLICY "Users can view boards they have access to"
ON public.boards FOR SELECT
USING (owner_id = auth.uid() OR public.has_board_access(id, auth.uid(), 'viewer'));

DROP POLICY IF EXISTS "Users can update their own boards" ON public.boards;
CREATE POLICY "Users can update boards they can edit"
ON public.boards FOR UPDATE
USING (owner_id = auth.uid() OR public.can_edit_board(id, auth.uid()));

-- Update columns RLS
DROP POLICY IF EXISTS "Users can view columns in their boards" ON public.columns;
CREATE POLICY "Users can view columns in accessible boards"
ON public.columns FOR SELECT
USING (EXISTS (
  SELECT 1 FROM boards b
  WHERE b.id = columns.board_id 
  AND (b.owner_id = auth.uid() OR public.has_board_access(b.id, auth.uid(), 'viewer'))
));

DROP POLICY IF EXISTS "Users can create columns in their boards" ON public.columns;
CREATE POLICY "Users can create columns in editable boards"
ON public.columns FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM boards b
  WHERE b.id = columns.board_id 
  AND (b.owner_id = auth.uid() OR public.can_edit_board(b.id, auth.uid()))
));

DROP POLICY IF EXISTS "Users can update columns in their boards" ON public.columns;
CREATE POLICY "Users can update columns in editable boards"
ON public.columns FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM boards b
  WHERE b.id = columns.board_id 
  AND (b.owner_id = auth.uid() OR public.can_edit_board(b.id, auth.uid()))
));

DROP POLICY IF EXISTS "Users can delete columns in their boards" ON public.columns;
CREATE POLICY "Users can delete columns in editable boards"
ON public.columns FOR DELETE
USING (EXISTS (
  SELECT 1 FROM boards b
  WHERE b.id = columns.board_id 
  AND (b.owner_id = auth.uid() OR public.can_edit_board(b.id, auth.uid()))
));

-- Update tasks RLS
DROP POLICY IF EXISTS "Users can view tasks in their boards" ON public.tasks;
CREATE POLICY "Users can view tasks in accessible boards"
ON public.tasks FOR SELECT
USING (EXISTS (
  SELECT 1 FROM columns c
  JOIN boards b ON c.board_id = b.id
  WHERE c.id = tasks.column_id 
  AND (b.owner_id = auth.uid() OR public.has_board_access(b.id, auth.uid(), 'viewer'))
));

DROP POLICY IF EXISTS "Users can create tasks in their boards" ON public.tasks;
CREATE POLICY "Users can create tasks in editable boards"
ON public.tasks FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM columns c
  JOIN boards b ON c.board_id = b.id
  WHERE c.id = tasks.column_id 
  AND (b.owner_id = auth.uid() OR public.can_edit_board(b.id, auth.uid()))
));

DROP POLICY IF EXISTS "Users can update tasks in their boards" ON public.tasks;
CREATE POLICY "Users can update tasks in editable boards"
ON public.tasks FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM columns c
  JOIN boards b ON c.board_id = b.id
  WHERE c.id = tasks.column_id 
  AND (b.owner_id = auth.uid() OR public.can_edit_board(b.id, auth.uid()))
));

DROP POLICY IF EXISTS "Users can delete tasks in their boards" ON public.tasks;
CREATE POLICY "Users can delete tasks in editable boards"
ON public.tasks FOR DELETE
USING (EXISTS (
  SELECT 1 FROM columns c
  JOIN boards b ON c.board_id = b.id
  WHERE c.id = tasks.column_id 
  AND (b.owner_id = auth.uid() OR public.can_edit_board(b.id, auth.uid()))
));

-- Update task_dependencies RLS
DROP POLICY IF EXISTS "Users can view dependencies in their boards" ON public.task_dependencies;
CREATE POLICY "Users can view dependencies in accessible boards"
ON public.task_dependencies FOR SELECT
USING (EXISTS (
  SELECT 1 FROM tasks t
  JOIN columns c ON t.column_id = c.id
  JOIN boards b ON c.board_id = b.id
  WHERE t.id = task_dependencies.task_id 
  AND (b.owner_id = auth.uid() OR public.has_board_access(b.id, auth.uid(), 'viewer'))
));

DROP POLICY IF EXISTS "Users can create dependencies in their boards" ON public.task_dependencies;
CREATE POLICY "Users can create dependencies in editable boards"
ON public.task_dependencies FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM tasks t
  JOIN columns c ON t.column_id = c.id
  JOIN boards b ON c.board_id = b.id
  WHERE t.id = task_dependencies.task_id 
  AND (b.owner_id = auth.uid() OR public.can_edit_board(b.id, auth.uid()))
));

DROP POLICY IF EXISTS "Users can delete dependencies in their boards" ON public.task_dependencies;
CREATE POLICY "Users can delete dependencies in editable boards"
ON public.task_dependencies FOR DELETE
USING (EXISTS (
  SELECT 1 FROM tasks t
  JOIN columns c ON t.column_id = c.id
  JOIN boards b ON c.board_id = b.id
  WHERE t.id = task_dependencies.task_id 
  AND (b.owner_id = auth.uid() OR public.can_edit_board(b.id, auth.uid()))
));

-- Update comments RLS
DROP POLICY IF EXISTS "Users can view comments in their boards" ON public.comments;
CREATE POLICY "Users can view comments in accessible boards"
ON public.comments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM tasks t
  JOIN columns c ON t.column_id = c.id
  JOIN boards b ON c.board_id = b.id
  WHERE t.id = comments.task_id 
  AND (b.owner_id = auth.uid() OR public.has_board_access(b.id, auth.uid(), 'viewer'))
));

DROP POLICY IF EXISTS "Users can create comments in their boards" ON public.comments;
CREATE POLICY "Users can create comments in accessible boards"
ON public.comments FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN columns c ON t.column_id = c.id
    JOIN boards b ON c.board_id = b.id
    WHERE t.id = comments.task_id 
    AND (b.owner_id = auth.uid() OR public.has_board_access(b.id, auth.uid(), 'viewer'))
  )
);

-- Function to accept an invite
CREATE OR REPLACE FUNCTION public.accept_board_invite(_invite_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
  current_user_email TEXT;
BEGIN
  -- Get current user's email
  SELECT email INTO current_user_email FROM auth.users WHERE id = auth.uid();
  
  -- Get the invite
  SELECT * INTO invite_record FROM board_invites 
  WHERE id = _invite_id AND email = current_user_email AND expires_at > now();
  
  IF invite_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Add user as board member
  INSERT INTO board_members (board_id, user_id, role)
  VALUES (invite_record.board_id, auth.uid(), invite_record.role)
  ON CONFLICT (board_id, user_id) DO UPDATE SET role = invite_record.role;
  
  -- Delete the invite
  DELETE FROM board_invites WHERE id = _invite_id;
  
  RETURN TRUE;
END;
$$;

-- Notify board owner when someone joins
CREATE OR REPLACE FUNCTION public.notify_member_joined()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  board_owner_id UUID;
  board_name TEXT;
  member_name TEXT;
BEGIN
  -- Get board info
  SELECT owner_id, name INTO board_owner_id, board_name
  FROM boards WHERE id = NEW.board_id;
  
  -- Get member name
  SELECT COALESCE(display_name, 'A team member') INTO member_name
  FROM profiles WHERE user_id = NEW.user_id;
  
  -- Notify owner (if not themselves)
  IF board_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (board_owner_id, 'member_joined', 'New Team Member', member_name || ' joined "' || board_name || '"');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_member_joined
AFTER INSERT ON public.board_members
FOR EACH ROW
EXECUTE FUNCTION public.notify_member_joined();