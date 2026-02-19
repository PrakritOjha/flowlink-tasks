import { supabase } from '@/integrations/supabase/client';

export interface DbBoard {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface DbColumn {
  id: string;
  board_id: string;
  title: string;
  position: number;
  created_at: string;
}

export interface DbTask {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  assignee_name: string | null;
  assignee_id: string | null;
  due_date: string | null;
  icon: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface DbTaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  created_at: string;
}

// Boards
export const fetchBoards = async () => {
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as DbBoard[];
};

export const createBoard = async (name: string, description?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('boards')
    .insert({
      name,
      description,
      owner_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  const board = data as DbBoard;

  // Create default columns for every new board
  const { error: colError } = await supabase.from('columns').insert([
    { board_id: board.id, title: 'To Do', position: 0 },
    { board_id: board.id, title: 'In Progress', position: 1 },
    { board_id: board.id, title: 'Done', position: 2 },
  ]);
  if (colError) throw colError;

  return board;
};

export const createDefaultBoard = async () => {
  // createBoard already creates default columns (To Do, In Progress, Done)
  return createBoard('My First Board', 'Get started with TaskLink');
};

export const updateBoard = async (boardId: string, updates: { name?: string; description?: string | null }) => {
  const { data, error } = await supabase
    .from('boards')
    .update(updates)
    .eq('id', boardId)
    .select()
    .single();

  if (error) throw error;
  return data as DbBoard;
};

export const deleteBoard = async (boardId: string) => {
  const { error } = await supabase
    .from('boards')
    .delete()
    .eq('id', boardId);

  if (error) throw error;
};

// Columns
export const fetchColumns = async (boardId: string) => {
  const { data, error } = await supabase
    .from('columns')
    .select('*')
    .eq('board_id', boardId)
    .order('position', { ascending: true });
  
  if (error) throw error;
  return data as DbColumn[];
};

export const createColumn = async (boardId: string, title: string, position: number) => {
  const { data, error } = await supabase
    .from('columns')
    .insert({ board_id: boardId, title, position })
    .select()
    .single();
  
  if (error) throw error;
  return data as DbColumn;
};

// Tasks
export const fetchTasks = async (columnIds: string[]) => {
  if (columnIds.length === 0) return [];
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .in('column_id', columnIds)
    .order('position', { ascending: true });
  
  if (error) throw error;
  return data as DbTask[];
};

export const createTask = async (task: {
  column_id: string;
  title: string;
  description?: string;
  assignee_name?: string;
  assignee_id?: string;
  due_date?: string;
  icon?: string;
  position?: number;
}) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      column_id: task.column_id,
      title: task.title,
      description: task.description || null,
      assignee_name: task.assignee_name || null,
      assignee_id: task.assignee_id || null,
      due_date: task.due_date || null,
      icon: task.icon || 'planning',
      position: task.position || 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data as DbTask;
};

export const updateTask = async (taskId: string, updates: Partial<DbTask>) => {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();
  
  if (error) throw error;
  return data as DbTask;
};

export const deleteTask = async (taskId: string) => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);
  
  if (error) throw error;
};

export const moveTask = async (taskId: string, newColumnId: string, newPosition: number) => {
  const { error } = await supabase
    .from('tasks')
    .update({ column_id: newColumnId, position: newPosition })
    .eq('id', taskId);
  
  if (error) throw error;
};

// Dependencies
export const fetchDependencies = async (taskIds: string[]) => {
  if (taskIds.length === 0) return [];
  
  const { data, error } = await supabase
    .from('task_dependencies')
    .select('*')
    .in('task_id', taskIds);
  
  if (error) throw error;
  return data as DbTaskDependency[];
};

export const createDependency = async (taskId: string, dependsOnTaskId: string) => {
  const { data, error } = await supabase
    .from('task_dependencies')
    .insert({ task_id: taskId, depends_on_task_id: dependsOnTaskId })
    .select()
    .single();
  
  if (error) throw error;
  return data as DbTaskDependency;
};

export const deleteDependency = async (dependencyId: string) => {
  const { error } = await supabase
    .from('task_dependencies')
    .delete()
    .eq('id', dependencyId);
  
  if (error) throw error;
};
