import { useState, useCallback } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useBoard } from '@/hooks/useBoard';
import { KanbanColumn } from './KanbanColumn';
import { DependencyArrows } from './DependencyArrows';
import { CreateTaskModal } from './CreateTaskModal';
import { TaskDetailModal } from './TaskDetailModal';
import { Board as BoardType, Task as TaskType, Column as ColumnType } from '@/types/kanban';

export const KanbanBoard = () => {
  const { columns, tasks, dependencies, loading, error, addTask, moveTask, refreshDependencies } = useBoard();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

  // Transform DB data to component format
  const board: BoardType = {
    columns: columns.map(col => ({
      id: col.id,
      title: col.title,
      tasks: tasks
        .filter(t => t.column_id === col.id)
        .sort((a, b) => a.position - b.position)
        .map(t => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          assignee: t.assignee_name || undefined,
          dueDate: t.due_date || undefined,
          icon: (t.icon as TaskType['icon']) || 'planning',
          dependsOn: dependencies
            .filter(d => d.task_id === t.id)
            .map(d => d.depends_on_task_id),
        })),
    })),
  };

  const allTasks = board.columns.flatMap(c => c.tasks);

  const onDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    await moveTask(draggableId, destination.droppableId, destination.index);
  }, [moveTask]);

  const handleCreateTask = useCallback(async (taskData: Omit<TaskType, 'id'>, columnId: string) => {
    const targetColumnId = selectedColumnId || columnId;
    const column = columns.find(c => c.id === targetColumnId);
    
    if (!column) {
      // If no column found by ID, try to find by title
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
        due_date: taskData.dueDate,
        icon: taskData.icon,
      });
    } else {
      await addTask({
        column_id: targetColumnId,
        title: taskData.title,
        description: taskData.description,
        assignee_name: taskData.assignee,
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
        <div 
          id="kanban-container"
          className="relative flex gap-6 p-6 min-w-max"
        >
          <DependencyArrows board={board} />
          
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
      />

      <TaskDetailModal
        open={isTaskDetailOpen}
        onOpenChange={setIsTaskDetailOpen}
        task={selectedTask}
        allTasks={allTasks}
        columns={board.columns}
        dependencies={dependencies}
        onDependencyChange={refreshDependencies}
      />
    </>
  );
};
