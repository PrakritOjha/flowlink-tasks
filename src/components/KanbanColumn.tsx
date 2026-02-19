import { Column, Task } from '@/types/kanban';
import { TaskCard } from './TaskCard';
import { Droppable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  column: Column;
  onAddTask: () => void;
  onTaskClick?: (task: Task) => void;
}

export const KanbanColumn = ({ column, onAddTask, onTaskClick }: KanbanColumnProps) => {
  return (
    <div className="flex flex-col gap-3 min-w-[280px] w-[280px] sm:min-w-[320px] sm:w-[320px]">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {column.title}
          </h3>
          <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {column.tasks.length}
          </span>
        </div>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-col gap-3 min-h-[400px] p-1.5 rounded-xl transition-all duration-200 ${
              snapshot.isDraggingOver
                ? 'bg-primary/5 ring-2 ring-primary/20 ring-inset'
                : 'bg-transparent'
            }`}
          >
            {column.tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onClick={() => onTaskClick?.(task)}
              />
            ))}
            {provided.placeholder}

            <button
              onClick={onAddTask}
              className="p-3 flex items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-all border-2 border-dashed border-border hover:border-primary/30 rounded-xl hover:bg-primary/5"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Task</span>
            </button>
          </div>
        )}
      </Droppable>
    </div>
  );
};
