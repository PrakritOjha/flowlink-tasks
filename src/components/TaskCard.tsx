import { Task } from '@/types/kanban';
import { Pencil, ListTree, Calendar, Link2, ClipboardCheck, ShieldAlert } from 'lucide-react';
import { Draggable } from '@hello-pangea/dnd';

interface TaskCardProps {
  task: Task;
  index: number;
  onClick?: () => void;
}

const iconMap = {
  design: Pencil,
  code: ListTree,
  planning: Calendar,
  dependency: Link2,
  requirements: ClipboardCheck,
};

const accentColors: Record<string, string> = {
  design: 'border-l-violet-500',
  code: 'border-l-blue-500',
  planning: 'border-l-amber-500',
  dependency: 'border-l-emerald-500',
  requirements: 'border-l-rose-500',
};

const iconBgColors: Record<string, string> = {
  design: 'bg-violet-50 text-violet-600',
  code: 'bg-blue-50 text-blue-600',
  planning: 'bg-amber-50 text-amber-600',
  dependency: 'bg-emerald-50 text-emerald-600',
  requirements: 'bg-rose-50 text-rose-600',
};

export const TaskCard = ({ task, index, onClick }: TaskCardProps) => {
  const Icon = iconMap[task.icon];
  const hasDependencies = task.dependsOn && task.dependsOn.length > 0;
  const isBlocked = task.blockedBy && task.blockedBy.length > 0;
  const accent = accentColors[task.icon] || 'border-l-primary';
  const iconBg = iconBgColors[task.icon] || 'bg-primary/10 text-primary';

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          data-task-id={task.id}
          onClick={onClick}
          className={`glass-card p-4 task-card-hover cursor-grab active:cursor-grabbing border-l-[3px] ${accent} ${
            snapshot.isDragging ? 'shadow-xl ring-2 ring-primary/20 scale-[1.02]' : ''
          } ${isBlocked ? 'opacity-75' : ''}`}
        >
          {isBlocked && (
            <div className="flex items-center gap-1.5 mb-2 px-2 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-700">
              <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-[11px] font-medium">
                Blocked by {task.blockedBy!.length} task{task.blockedBy!.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground text-sm mb-1 truncate">
                {task.title}
              </h4>
              {task.description && (
                <p className="text-muted-foreground text-xs truncate">
                  {task.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2.5">
                {task.assignee && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {task.assignee}
                  </span>
                )}
                {hasDependencies && (
                  <div className="flex items-center gap-1 text-xs text-primary font-medium">
                    <Link2 className="w-3 h-3" />
                    <span>{task.dependsOn?.length}</span>
                  </div>
                )}
              </div>
            </div>
            <div className={`flex-shrink-0 p-2 rounded-lg ${iconBg}`}>
              <Icon className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};
