import { useState } from 'react';
import { Filter, MoreHorizontal, UserPlus } from 'lucide-react';
import { useBoard } from '@/hooks/useBoard';
import { useBoardMembers } from '@/hooks/useBoardMembers';
import { BoardSwitcher } from './BoardSwitcher';
import { TeamManagementModal } from './TeamManagementModal';

export const BoardHeader = () => {
  const { boards, currentBoard, columns, tasks, dependencies, switchBoard, reloadBoards } = useBoard();
  const { members } = useBoardMembers(currentBoard?.id || null);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  
  const totalTasks = tasks.length;
  const totalDependencies = dependencies.length;

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4">
        <div className="space-y-2">
          <BoardSwitcher
            boards={boards}
            currentBoard={currentBoard}
            onBoardChange={switchBoard}
            onBoardCreated={reloadBoards}
          />
          <p className="text-sm text-muted-foreground">
            {columns.length} columns • {totalTasks} tasks • {totalDependencies} dependencies
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {members.slice(0, 3).map((member, i) => (
              <div
                key={member.id}
                className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-medium"
                style={{
                  background: `hsl(${200 + i * 30} 60% ${50 + i * 10}%)`,
                  color: 'white',
                }}
                title={member.profile?.display_name || 'Team member'}
              >
                {member.profile?.display_name?.slice(0, 2).toUpperCase() || 'TM'}
              </div>
            ))}
            {members.length > 3 && (
              <div className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                +{members.length - 3}
              </div>
            )}
            <button 
              onClick={() => setTeamModalOpen(true)}
              className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center hover:border-foreground/50 transition-colors"
              title="Manage team"
            >
              <UserPlus className="w-4 h-4 text-muted-foreground" />
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

      <TeamManagementModal
        open={teamModalOpen}
        onOpenChange={setTeamModalOpen}
        board={currentBoard}
      />
    </>
  );
};
