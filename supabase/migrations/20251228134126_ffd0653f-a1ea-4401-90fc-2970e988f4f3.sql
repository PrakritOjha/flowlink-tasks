-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create boards table
CREATE TABLE public.boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on boards
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- Boards policies (owner can do everything)
CREATE POLICY "Users can view their own boards"
  ON public.boards FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create boards"
  ON public.boards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own boards"
  ON public.boards FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own boards"
  ON public.boards FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Create columns table
CREATE TABLE public.columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on columns
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;

-- Columns policies (inherit from board ownership)
CREATE POLICY "Users can view columns in their boards"
  ON public.columns FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.boards WHERE id = board_id AND owner_id = auth.uid()
  ));

CREATE POLICY "Users can create columns in their boards"
  ON public.columns FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.boards WHERE id = board_id AND owner_id = auth.uid()
  ));

CREATE POLICY "Users can update columns in their boards"
  ON public.columns FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.boards WHERE id = board_id AND owner_id = auth.uid()
  ));

CREATE POLICY "Users can delete columns in their boards"
  ON public.columns FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.boards WHERE id = board_id AND owner_id = auth.uid()
  ));

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID NOT NULL REFERENCES public.columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee_name TEXT,
  due_date DATE,
  icon TEXT NOT NULL DEFAULT 'planning',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Tasks policies (inherit from column -> board ownership)
CREATE POLICY "Users can view tasks in their boards"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.columns c
    JOIN public.boards b ON c.board_id = b.id
    WHERE c.id = column_id AND b.owner_id = auth.uid()
  ));

CREATE POLICY "Users can create tasks in their boards"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.columns c
    JOIN public.boards b ON c.board_id = b.id
    WHERE c.id = column_id AND b.owner_id = auth.uid()
  ));

CREATE POLICY "Users can update tasks in their boards"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.columns c
    JOIN public.boards b ON c.board_id = b.id
    WHERE c.id = column_id AND b.owner_id = auth.uid()
  ));

CREATE POLICY "Users can delete tasks in their boards"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.columns c
    JOIN public.boards b ON c.board_id = b.id
    WHERE c.id = column_id AND b.owner_id = auth.uid()
  ));

-- Create task_dependencies table
CREATE TABLE public.task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, depends_on_task_id),
  CHECK (task_id != depends_on_task_id)
);

-- Enable RLS on task_dependencies
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

-- Task dependencies policies
CREATE POLICY "Users can view dependencies in their boards"
  ON public.task_dependencies FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.columns c ON t.column_id = c.id
    JOIN public.boards b ON c.board_id = b.id
    WHERE t.id = task_id AND b.owner_id = auth.uid()
  ));

CREATE POLICY "Users can create dependencies in their boards"
  ON public.task_dependencies FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.columns c ON t.column_id = c.id
    JOIN public.boards b ON c.board_id = b.id
    WHERE t.id = task_id AND b.owner_id = auth.uid()
  ));

CREATE POLICY "Users can delete dependencies in their boards"
  ON public.task_dependencies FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.columns c ON t.column_id = c.id
    JOIN public.boards b ON c.board_id = b.id
    WHERE t.id = task_id AND b.owner_id = auth.uid()
  ));

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_boards_updated_at
  BEFORE UPDATE ON public.boards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();