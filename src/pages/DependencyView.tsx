import { Header } from '@/components/Header';
import { DependencyFlowView } from '@/components/DependencyFlowView';
import { useBoard } from '@/hooks/useBoard';
import { Board } from '@/types/kanban';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const DependencyViewPage = () => {
  const { columns, tasks, dependencies, loading, currentBoard } = useBoard();

  // Transform DB data to component format
  const board: Board = {
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
          icon: (t.icon as 'design' | 'code' | 'planning' | 'dependency' | 'requirements') || 'planning',
          dependsOn: dependencies
            .filter(d => d.task_id === t.id)
            .map(d => d.depends_on_task_id),
        })),
    })),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col">
        <div className="flex items-center gap-4 px-6 py-4 border-b border-border/30">
          <Link 
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Board</span>
          </Link>
          <div className="h-4 w-px bg-border/50" />
          <h1 className="text-lg font-semibold text-foreground">
            {currentBoard?.name || 'Project'} - Dependencies
          </h1>
        </div>
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <DependencyFlowView board={board} />
        )}
      </main>
    </div>
  );
};

export default DependencyViewPage;
