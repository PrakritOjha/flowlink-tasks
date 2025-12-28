import { useState, useCallback } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Board } from '@/types/kanban';
import { initialBoard } from '@/data/initialData';
import { KanbanColumn } from './KanbanColumn';
import { DependencyArrows } from './DependencyArrows';

export const KanbanBoard = () => {
  const [board, setBoard] = useState<Board>(initialBoard);

  const onDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result;

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

  return (
    <div className="relative w-full overflow-x-auto">
      <div 
        id="kanban-container"
        className="relative flex gap-6 p-6 min-w-max"
      >
        <DependencyArrows board={board} />
        
        <DragDropContext onDragEnd={onDragEnd}>
          {board.columns.map((column) => (
            <KanbanColumn key={column.id} column={column} />
          ))}
        </DragDropContext>
      </div>
    </div>
  );
};
