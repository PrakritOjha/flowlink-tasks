import { useState, useEffect, useCallback, useRef, createContext, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchBoards,
  fetchColumns,
  fetchTasks,
  fetchDependencies,
  createDefaultBoard,
  createTask,
  moveTask,
  createBoard,
  updateBoard,
  deleteBoard,
  DbBoard,
  DbColumn,
  DbTask,
  DbTaskDependency,
} from '@/lib/database';
import { fetchMyInvites, acceptBoardInvite } from '@/lib/database/members';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface BoardContextType {
  boards: DbBoard[];
  currentBoard: DbBoard | null;
  columns: DbColumn[];
  tasks: DbTask[];
  dependencies: DbTaskDependency[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterAssignee: string | null;
  setFilterAssignee: (assignee: string | null) => void;
  filterStatus: string | null;
  setFilterStatus: (status: string | null) => void;
  addTask: (taskData: {
    column_id: string;
    title: string;
    description?: string;
    assignee_name?: string;
    assignee_id?: string;
    due_date?: string;
    icon?: string;
  }) => Promise<DbTask>;
  moveTask: (taskId: string, newColumnId: string, newPosition: number) => Promise<void>;
  switchBoard: (boardId: string) => void;
  refresh: () => Promise<void>;
  reloadBoards: () => Promise<void>;
  refreshDependencies: () => Promise<void>;
  handleCreateBoard: (name: string, description?: string) => Promise<void>;
  handleUpdateBoard: (boardId: string, updates: { name?: string; description?: string | null }) => Promise<void>;
  handleDeleteBoard: (boardId: string) => Promise<void>;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export const BoardProvider = ({ boardId, children }: { boardId?: string; children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [boards, setBoards] = useState<DbBoard[]>([]);
  const [currentBoard, setCurrentBoard] = useState<DbBoard | null>(null);
  const [columns, setColumns] = useState<DbColumn[]>([]);
  const [tasks, setTasks] = useState<DbTask[]>([]);
  const [dependencies, setDependencies] = useState<DbTaskDependency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Guard against concurrent default board creation
  const creatingDefaultBoard = useRef(false);
  const initCalled = useRef(false);

  // Load board data (columns, tasks, deps)
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
      if (!user || initCalled.current) return;
      initCalled.current = true;

      setLoading(true);
      try {
        // Auto-accept any pending board invites before loading boards,
        // so invited boards show up immediately and we don't
        // mistakenly create a default board.
        try {
          const pendingInvites = await fetchMyInvites();
          if (pendingInvites.length > 0) {
            for (const invite of pendingInvites) {
              await acceptBoardInvite(invite.id);
            }
            toast({
              title: 'Board invite accepted!',
              description: `You've been added to ${pendingInvites.length} board(s).`,
            });
          }
        } catch {
          // Non-critical — invites can still be accepted manually
        }

        let allBoards = await fetchBoards();

        // Create default board if none exist (with guard)
        if (allBoards.length === 0 && !creatingDefaultBoard.current) {
          creatingDefaultBoard.current = true;
          try {
            const newBoard = await createDefaultBoard();
            allBoards = [newBoard];
          } finally {
            creatingDefaultBoard.current = false;
          }
        }

        setBoards(allBoards);

        if (allBoards.length > 0) {
          const targetBoard = boardId
            ? allBoards.find(b => b.id === boardId) || allBoards[0]
            : allBoards[0];

          // If no boardId in URL, redirect to the target board
          if (!boardId) {
            navigate(`/board/${targetBoard.id}`, { replace: true });
          }

          await loadBoardData(targetBoard);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError((err as Error).message);
        setLoading(false);
      }
    };

    init();
  }, [user, boardId, loadBoardData, navigate]);

  // Reset init guard when user changes (sign out → sign in)
  useEffect(() => {
    if (!user) {
      initCalled.current = false;
      creatingDefaultBoard.current = false;
    }
  }, [user]);

  // When boardId changes from URL, switch to that board
  useEffect(() => {
    if (boardId && boards.length > 0 && currentBoard?.id !== boardId) {
      const board = boards.find(b => b.id === boardId);
      if (board) {
        setLoading(true);
        loadBoardData(board);
      }
    }
  }, [boardId, boards, currentBoard?.id, loadBoardData]);

  // Switch board via URL navigation
  const switchBoard = useCallback((newBoardId: string) => {
    navigate(`/board/${newBoardId}`);
  }, [navigate]);

  // Add task
  const addTask = useCallback(async (taskData: {
    column_id: string;
    title: string;
    description?: string;
    assignee_name?: string;
    assignee_id?: string;
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
      toast({
        title: 'Failed to move task',
        description: (err as Error).message,
        variant: 'destructive',
      });
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
    try {
      const allBoards = await fetchBoards();
      setBoards(allBoards);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  // Create a new board and navigate to it
  const handleCreateBoard = useCallback(async (name: string, description?: string) => {
    const newBoard = await createBoard(name, description);
    const allBoards = await fetchBoards();
    setBoards(allBoards);
    navigate(`/board/${newBoard.id}`);
  }, [navigate]);

  // Update board name/description
  const handleUpdateBoard = useCallback(async (boardId: string, updates: { name?: string; description?: string | null }) => {
    const updated = await updateBoard(boardId, updates);
    setBoards(prev => prev.map(b => b.id === boardId ? updated : b));
    if (currentBoard?.id === boardId) {
      setCurrentBoard(updated);
    }
  }, [currentBoard?.id]);

  // Delete a board
  const handleDeleteBoard = useCallback(async (boardId: string) => {
    await deleteBoard(boardId);
    const remaining = boards.filter(b => b.id !== boardId);
    setBoards(remaining);

    if (currentBoard?.id === boardId) {
      if (remaining.length > 0) {
        navigate(`/board/${remaining[0].id}`, { replace: true });
      } else {
        // Create a fresh default board if the user deleted their last one
        const newBoard = await createDefaultBoard();
        setBoards([newBoard]);
        navigate(`/board/${newBoard.id}`, { replace: true });
      }
    }
  }, [boards, currentBoard?.id, navigate]);

  // Refresh dependencies only
  const refreshDependencies = useCallback(async () => {
    if (tasks.length > 0) {
      const taskIds = tasks.map(t => t.id);
      const depsData = await fetchDependencies(taskIds);
      setDependencies(depsData);
    }
  }, [tasks]);

  return (
    <BoardContext.Provider value={{
      boards,
      currentBoard,
      columns,
      tasks,
      dependencies,
      loading,
      error,
      searchQuery,
      setSearchQuery,
      filterAssignee,
      setFilterAssignee,
      filterStatus,
      setFilterStatus,
      addTask,
      moveTask: handleMoveTask,
      switchBoard,
      refresh,
      reloadBoards,
      refreshDependencies,
      handleCreateBoard,
      handleUpdateBoard,
      handleDeleteBoard,
    }}>
      {children}
    </BoardContext.Provider>
  );
};

export const useBoard = () => {
  const context = useContext(BoardContext);
  if (context === undefined) {
    throw new Error('useBoard must be used within a BoardProvider');
  }
  return context;
};

/** Safe version that returns null when used outside a BoardProvider. */
export const useBoardOptional = (): BoardContextType | null => {
  return useContext(BoardContext) ?? null;
};
