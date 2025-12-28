import { Header } from '@/components/Header';
import { DependencyFlowView } from '@/components/DependencyFlowView';
import { initialBoard } from '@/data/initialData';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const DependencyViewPage = () => {
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
          <h1 className="text-lg font-semibold text-foreground">Project Alpha - Dependencies</h1>
        </div>
        <DependencyFlowView board={initialBoard} />
      </main>
    </div>
  );
};

export default DependencyViewPage;
