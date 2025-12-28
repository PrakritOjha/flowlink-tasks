import { useState, useCallback } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Board, Task } from '@/types/kanban';
import { initialBoard } from '@/data/initialData';
import { KanbanColumn } from './KanbanColumn';
import { DependencyArrows } from './DependencyArrows';
import { CreateTaskModal } from './CreateTaskModal';

export const KanbanBoard = () => {
  const [board, setBoard] = useState<Board>(initialBoard);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const onDragEnd = useCallback((result: DropResult) => {
    const { destination, source } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    setBoard((prevBoard) => {
      const newColumns = [...prevBoard.columns];
      
      const sourceColIndex = newColumns.findIndex(
        (col) => col.id === source.droppableId
      );
      const destColIndex = newColumns.findIndex(
        (col) => col.id === destination.droppableId
      );

      const sourceCol = { ...newColumns[sourceColIndex] };
      const destCol = source.droppableId === destination.droppableId 
        ? sourceCol 
        : { ...newColumns[destColIndex] };

      const sourceTasks = [...sourceCol.tasks];
      const destTasks = source.droppableId === destination.droppableId 
        ? sourceTasks 
        : [...destCol.tasks];

      const [movedTask] = sourceTasks.splice(source.index, 1);
      destTasks.splice(destination.index, 0, movedTask);

      sourceCol.tasks = sourceTasks;
      destCol.tasks = destTasks;

      newColumns[sourceColIndex] = sourceCol;
      if (source.droppableId !== destination.droppableId) {
        newColumns[destColIndex] = destCol;
      }

      return { columns: newColumns };
    });
  }, []);

  const handleCreateTask = useCallback((taskData: Omit<Task, 'id'>, columnId: string) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
    };

    setBoard((prevBoard) => {
      const newColumns = prevBoard.columns.map((column) => {
        if (column.id === columnId) {
          return {
            ...column,
            tasks: [...column.tasks, newTask],
          };
        }
        return column;
      });
      return { columns: newColumns };
    });
  }, []);

  const handleOpenCreateModal = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

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
                onAddTask={handleOpenCreateModal}
              />
            ))}
          </DragDropContext>
        </div>
      </div>

      <CreateTaskModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onCreateTask={handleCreateTask}
      />
    </>
  );
};
