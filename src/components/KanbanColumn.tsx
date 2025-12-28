import { Column } from '@/types/kanban';
import { TaskCard } from './TaskCard';
import { Droppable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  column: Column;
  onAddTask: () => void;
}

export const KanbanColumn = ({ column, onAddTask }: KanbanColumnProps) => {
  return (
    <div className="flex flex-col gap-4 min-w-[320px] w-[320px]">
      <div className="glass-column-header text-foreground">
        {column.title}
      </div>
      
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-col gap-3 min-h-[400px] p-2 rounded-xl transition-colors ${
              snapshot.isDraggingOver ? 'bg-foreground/5' : ''
            }`}
          >
            {column.tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}
            {provided.placeholder}
            
            <button 
              onClick={onAddTask}
              className="glass-card p-3 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors opacity-60 hover:opacity-100"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add Task</span>
            </button>
          </div>
        )}
      </Droppable>
    </div>
  );
};
