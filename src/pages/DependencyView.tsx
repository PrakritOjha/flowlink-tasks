import { useParams } from 'react-router-dom';
import { BoardProvider, useBoard } from '@/hooks/useBoard';
import { Header } from '@/components/Header';
import { DependencyFlowView } from '@/components/DependencyFlowView';
import { Board } from '@/types/kanban';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const DependencyViewContent = () => {
  const { columns, tasks, dependencies, loading, currentBoard } = useBoard();

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

  const backUrl = currentBoard ? `/board/${currentBoard.id}` : '/';

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 sm:px-6 py-3 border-b border-border shrink-0">
        <Link
          to={backUrl}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Board</span>
        </Link>
        <div className="hidden sm:block h-4 w-px bg-border" />
        <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">
          {currentBoard?.name || 'Project'} - Dependencies
        </h1>
      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <DependencyFlowView board={board} />
      )}
    </div>
  );
};

const DependencyViewPage = () => {
  const { boardId } = useParams<{ boardId: string }>();

  return (
    <BoardProvider boardId={boardId}>
      <DependencyViewContent />
    </BoardProvider>
  );
};

export default DependencyViewPage;
