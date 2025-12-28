import { useState, useEffect, useCallback } from 'react';
import { 
  fetchBoards, 
  fetchColumns, 
  fetchTasks, 
  fetchDependencies,
  createDefaultBoard,
  createTask,
  moveTask,
  DbBoard,
  DbColumn,
  DbTask,
  DbTaskDependency,
} from '@/lib/database';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface BoardData {
  board: DbBoard | null;
  columns: DbColumn[];
  tasks: DbTask[];
  dependencies: DbTaskDependency[];
  loading: boolean;
  error: string | null;
}

export const useBoard = (boardId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [boards, setBoards] = useState<DbBoard[]>([]);
  const [currentBoard, setCurrentBoard] = useState<DbBoard | null>(null);
  const [columns, setColumns] = useState<DbColumn[]>([]);
  const [tasks, setTasks] = useState<DbTask[]>([]);
  const [dependencies, setDependencies] = useState<DbTaskDependency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all boards for the user
  const loadBoards = useCallback(async () => {
    if (!user) return [];
    
    try {
      const data = await fetchBoards();
      setBoards(data);
      
      // If no boards exist, create a default one
      if (data.length === 0) {
        const newBoard = await createDefaultBoard();
        setBoards([newBoard]);
        return [newBoard];
      }
      
      return data;
    } catch (err) {
      setError((err as Error).message);
      return [];
    }
  }, [user]);

  // Load board data
  const loadBoardData = useCallback(async (board: DbBoard) => {
    try {
      setCurrentBoard(board);
      
      const columnsData = await fetchColumns(board.id);
      setColumns(columnsData);
      
      if (columnsData.length > 0) {
        const columnIds = columnsData.map(c => c.id);
        const tasksData = await fetchTasks(columnIds);
        setTasks(tasksData);
        
        if (tasksData.length > 0) {
          const taskIds = tasksData.map(t => t.id);
          const depsData = await fetchDependencies(taskIds);
          setDependencies(depsData);
        } else {
          setDependencies([]);
        }
      } else {
        setTasks([]);
        setDependencies([]);
      }
      
      setLoading(false);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const allBoards = await loadBoards();
      if (allBoards.length > 0) {
        const targetBoard = boardId 
          ? allBoards.find(b => b.id === boardId) || allBoards[0]
          : allBoards[0];
        await loadBoardData(targetBoard);
      } else {
        setLoading(false);
      }
    };
    
    init();
  }, [user, boardId, loadBoards, loadBoardData]);

  // Switch board
  const switchBoard = useCallback(async (newBoardId: string) => {
    const board = boards.find(b => b.id === newBoardId);
    if (board) {
      setLoading(true);
      await loadBoardData(board);
    }
  }, [boards, loadBoardData]);

  // Add task
  const addTask = useCallback(async (taskData: {
    column_id: string;
    title: string;
    description?: string;
    assignee_name?: string;
    due_date?: string;
    icon?: string;
  }) => {
    try {
      const existingTasks = tasks.filter(t => t.column_id === taskData.column_id);
      const position = existingTasks.length;
      
      const newTask = await createTask({
        ...taskData,
        position,
      });
      
      setTasks(prev => [...prev, newTask]);
      toast({
        title: 'Task created',
        description: `"${taskData.title}" has been added`,
      });
      
      return newTask;
    } catch (err) {
      toast({
        title: 'Failed to create task',
        description: (err as Error).message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [tasks, toast]);

  // Move task (drag & drop)
  const handleMoveTask = useCallback(async (
    taskId: string, 
    newColumnId: string, 
    newPosition: number
  ) => {
    // Optimistic update
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, column_id: newColumnId, position: newPosition }
        : t
    ));
    
    try {
      await moveTask(taskId, newColumnId, newPosition);
    } catch (err) {
      // Revert on error
      toast({
        title: 'Failed to move task',
        description: (err as Error).message,
        variant: 'destructive',
      });
      // Reload to get correct state
      if (currentBoard) {
        await loadBoardData(currentBoard);
      }
    }
  }, [currentBoard, loadBoardData, toast]);

  // Refresh data
  const refresh = useCallback(async () => {
    if (currentBoard) {
      setLoading(true);
      await loadBoardData(currentBoard);
    }
  }, [currentBoard, loadBoardData]);

  // Reload boards list
  const reloadBoards = useCallback(async () => {
    const allBoards = await loadBoards();
    if (allBoards.length > 0 && !currentBoard) {
      await loadBoardData(allBoards[0]);
    }
  }, [loadBoards, loadBoardData, currentBoard]);

  // Refresh dependencies only
  const refreshDependencies = useCallback(async () => {
    if (tasks.length > 0) {
      const taskIds = tasks.map(t => t.id);
      const depsData = await fetchDependencies(taskIds);
      setDependencies(depsData);
    }
  }, [tasks]);

  return {
    boards,
    currentBoard,
    columns,
    tasks,
    dependencies,
    loading,
    error,
    addTask,
    moveTask: handleMoveTask,
    switchBoard,
    refresh,
    reloadBoards,
    refreshDependencies,
  };
};
