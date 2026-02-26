import { useState, useCallback, useMemo } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useBoard } from '@/hooks/useBoard';
import { useBoardMembers } from '@/hooks/useBoardMembers';
import { useAuth } from '@/hooks/useAuth';
import { KanbanColumn } from './KanbanColumn';
import { CreateTaskModal, AssigneeOption } from './CreateTaskModal';
import { TaskDetailModal } from './TaskDetailModal';
import { Board as BoardType, Task as TaskType, Column as ColumnType } from '@/types/kanban';
import { useToast } from '@/hooks/use-toast';

export const KanbanBoard = () => {
  const { columns, tasks, dependencies, loading, error, addTask, moveTask, refresh, refreshDependencies, searchQuery, filterAssignee, filterStatus, currentBoard } = useBoard();
  const { user } = useAuth();
  const { members } = useBoardMembers(currentBoard?.id || null);
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

  // Find the "Done" column ID
  const doneColumnId = useMemo(
    () => columns.find(c => c.title.toLowerCase() === 'done')?.id,
    [columns]
  );

  // Build a set of task IDs that are in the "Done" column
  const doneTaskIds = useMemo(() => {
    if (!doneColumnId) return new Set<string>();
    return new Set(tasks.filter(t => t.column_id === doneColumnId).map(t => t.id));
  }, [tasks, doneColumnId]);

  // Apply search + filter to tasks
  const filteredTasks = useMemo(() => {
    let result = tasks;
    // Search by title/description
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }
    // Filter by assignee
    if (filterAssignee) {
      if (filterAssignee === '_unassigned') {
        result = result.filter(t => !t.assignee_name);
      } else {
        result = result.filter(t => t.assignee_name === filterAssignee);
      }
    }
    // Filter by status (column)
    if (filterStatus) {
      result = result.filter(t => t.column_id === filterStatus);
    }
    return result;
  }, [tasks, searchQuery, filterAssignee, filterStatus]);

  // Transform DB data to component format with blockedBy computation
  const board: BoardType = useMemo(() => ({
    columns: columns.map(col => ({
      id: col.id,
      title: col.title,
      tasks: filteredTasks
        .filter(t => t.column_id === col.id)
        .sort((a, b) => a.position - b.position)
        .map(t => {
          const taskDeps = dependencies
            .filter(d => d.task_id === t.id)
            .map(d => d.depends_on_task_id);

          // blockedBy = dependency IDs that are NOT yet in "Done"
          const blockedBy = taskDeps.filter(depId => !doneTaskIds.has(depId));

          return {
            id: t.id,
            title: t.title,
            description: t.description || '',
            assignee: t.assignee_name || undefined,
            assigneeId: t.assignee_id || undefined,
            dueDate: t.due_date || undefined,
            icon: (t.icon as TaskType['icon']) || 'planning',
            dependsOn: taskDeps,
            blockedBy: blockedBy.length > 0 ? blockedBy : undefined,
          };
        }),
    })),
  }), [columns, filteredTasks, dependencies, doneTaskIds]);

  // Build assignee options: board owner + team members
  const assigneeOptions: AssigneeOption[] = useMemo(() => {
    const options: AssigneeOption[] = [];

    // Add board owner
    if (user && currentBoard?.owner_id === user.id) {
      options.push({
        id: user.id,
        name: user.user_metadata?.display_name || user.email || 'Owner',
      });
    }

    // Add team members (editors)
    members.forEach(m => {
      // Skip if already added as owner
      if (m.user_id === user?.id) return;
      options.push({
        id: m.user_id,
        name: m.profile?.display_name || 'Team Member',
      });
    });

    return options;
  }, [user, currentBoard?.owner_id, members]);

  const allTasks = board.columns.flatMap(c => c.tasks);

  // Find the "In Progress" column ID for drag warning
  const inProgressColumnId = useMemo(
    () => columns.find(c => c.title.toLowerCase() === 'in progress')?.id,
    [columns]
  );

  const onDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Check if dragging a blocked task into "In Progress" or "Done"
    const draggedTask = allTasks.find(t => t.id === draggableId);
    const isBlocked = draggedTask?.blockedBy && draggedTask.blockedBy.length > 0;
    const destColumn = columns.find(c => c.id === destination.droppableId);
    const destTitle = destColumn?.title.toLowerCase();

    if (isBlocked && (destTitle === 'in progress' || destTitle === 'done')) {
      const blockerNames = draggedTask!.blockedBy!
        .map(id => allTasks.find(t => t.id === id)?.title || 'Unknown')
        .join(', ');

      toast({
        title: 'Task is blocked',
        description: `This task is waiting on: ${blockerNames}. Moving it anyway.`,
        variant: 'destructive',
      });
    }

    await moveTask(draggableId, destination.droppableId, destination.index);
  }, [moveTask, allTasks, columns, toast]);

  const handleCreateTask = useCallback(async (taskData: Omit<TaskType, 'id'>, columnId: string) => {
    const targetColumnId = selectedColumnId || columnId;
    const column = columns.find(c => c.id === targetColumnId);

    if (!column) {
      const columnMap: Record<string, string> = {};
      columns.forEach(c => {
        if (c.title === 'To Do') columnMap['todo'] = c.id;
        if (c.title === 'In Progress') columnMap['in-progress'] = c.id;
        if (c.title === 'Done') columnMap['done'] = c.id;
      });

      const actualColumnId = columnMap[columnId] || columns[0]?.id;
      if (!actualColumnId) return;

      await addTask({
        column_id: actualColumnId,
        title: taskData.title,
        description: taskData.description,
        assignee_name: taskData.assignee,
        assignee_id: taskData.assigneeId,
        due_date: taskData.dueDate,
        icon: taskData.icon,
      });
    } else {
      await addTask({
        column_id: targetColumnId,
        title: taskData.title,
        description: taskData.description,
        assignee_name: taskData.assignee,
        assignee_id: taskData.assigneeId,
        due_date: taskData.dueDate,
        icon: taskData.icon,
      });
    }

    setSelectedColumnId(null);
  }, [addTask, columns, selectedColumnId]);

  const handleOpenCreateModal = useCallback((columnId?: string) => {
    if (columnId) {
      setSelectedColumnId(columnId);
    }
    setIsCreateModalOpen(true);
  }, []);

  const handleTaskClick = useCallback((task: TaskType) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load board</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (columns.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">No columns found. Creating default board...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full overflow-x-auto">
        <div className="flex gap-4 sm:gap-6 p-4 sm:p-6 min-w-max">
          <DragDropContext onDragEnd={onDragEnd}>
            {board.columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                onAddTask={() => handleOpenCreateModal(column.id)}
                onTaskClick={handleTaskClick}
              />
            ))}
          </DragDropContext>
        </div>
      </div>

      <CreateTaskModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onCreateTask={handleCreateTask}
        columns={columns.map(c => ({ id: c.id, title: c.title }))}
        defaultColumnId={selectedColumnId || undefined}
        assigneeOptions={assigneeOptions}
        existingTaskTitles={tasks.map(t => t.title.toLowerCase())}
      />

      <TaskDetailModal
        open={isTaskDetailOpen}
        onOpenChange={setIsTaskDetailOpen}
        task={selectedTask}
        allTasks={allTasks}
        columns={board.columns}
        dependencies={dependencies}
        onDependencyChange={refreshDependencies}
        onTaskUpdate={refresh}
        onTaskDelete={() => { refresh(); setSelectedTask(null); }}
        assigneeOptions={assigneeOptions}
      />
    </>
  );
};
