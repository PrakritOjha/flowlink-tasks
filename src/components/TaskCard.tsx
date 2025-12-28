import { Task } from '@/types/kanban';
import { Pencil, ListTree, Calendar, Link2, ClipboardCheck } from 'lucide-react';
import { Draggable } from '@hello-pangea/dnd';

interface TaskCardProps {
  task: Task;
  index: number;
}

const iconMap = {
  design: Pencil,
  code: ListTree,
  planning: Calendar,
  dependency: Link2,
  requirements: ClipboardCheck,
};

export const TaskCard = ({ task, index }: TaskCardProps) => {
  const Icon = iconMap[task.icon];

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          data-task-id={task.id}
          className={`glass-card p-4 task-card-hover cursor-grab active:cursor-grabbing ${
            snapshot.isDragging ? 'shadow-2xl scale-105' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground text-base mb-1 truncate">
                {task.title}
              </h4>
              <p className="text-muted-foreground text-sm truncate">
                {task.description}
              </p>
              {task.assignee && (
                <p className="text-xs text-muted-foreground/70 mt-2">
                  {task.id.replace('task-', 'Task ').toUpperCase().slice(0, 6)} - {task.assignee}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 p-2 rounded-lg bg-foreground/10">
              <Icon className="w-4 h-4 text-foreground/80" />
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};
