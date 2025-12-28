import { Users, Filter, MoreHorizontal } from 'lucide-react';
import { useBoard } from '@/hooks/useBoard';

export const BoardHeader = () => {
  const { currentBoard, columns, tasks, dependencies } = useBoard();
  
  const totalTasks = tasks.length;
  const totalDependencies = dependencies.length;

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {currentBoard?.name || 'Loading...'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {columns.length} columns • {totalTasks} tasks • {totalDependencies} dependencies
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          {['BG', 'ZK', 'JD'].map((initials, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-medium"
              style={{
                background: `hsl(${200 + i * 30} 60% ${50 + i * 10}%)`,
                color: 'white',
              }}
            >
              {initials}
            </div>
          ))}
          <button className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center hover:border-foreground/50 transition-colors">
            <Users className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-foreground/5 transition-colors text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span className="text-sm">Filter</span>
        </button>

        <button className="p-2 rounded-lg hover:bg-foreground/5 transition-colors">
          <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};
