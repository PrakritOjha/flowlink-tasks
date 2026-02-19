import { useParams } from 'react-router-dom';
import { BoardProvider } from '@/hooks/useBoard';
import { Header } from '@/components/Header';
import { BoardHeader } from '@/components/BoardHeader';
import { KanbanBoard } from '@/components/KanbanBoard';

const Index = () => {
  const { boardId } = useParams<{ boardId?: string }>();

  return (
    <BoardProvider boardId={boardId}>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col">
          <BoardHeader />
          <KanbanBoard />
        </main>
      </div>
    </BoardProvider>
  );
};

export default Index;
