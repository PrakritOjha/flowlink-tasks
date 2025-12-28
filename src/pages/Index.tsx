import { Header } from '@/components/Header';
import { BoardHeader } from '@/components/BoardHeader';
import { KanbanBoard } from '@/components/KanbanBoard';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col">
        <BoardHeader />
        <KanbanBoard />
      </main>
    </div>
  );
};

export default Index;
