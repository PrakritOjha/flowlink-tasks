import { useState } from 'react';
import { DbBoard, createBoard } from '@/lib/database';
import { ChevronDown, Plus, Layout } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface BoardSwitcherProps {
  boards: DbBoard[];
  currentBoard: DbBoard | null;
  onBoardChange: (boardId: string) => void;
  onBoardCreated: () => void;
}

export const BoardSwitcher = ({
  boards,
  currentBoard,
  onBoardChange,
  onBoardCreated,
}: BoardSwitcherProps) => {
  const { toast } = useToast();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;

    setCreating(true);
    try {
      await createBoard(newBoardName.trim(), newBoardDescription.trim() || undefined);
      setCreateModalOpen(false);
      setNewBoardName('');
      setNewBoardDescription('');
      onBoardCreated();
      toast({ title: 'Board created successfully' });
    } catch (error) {
      toast({ title: 'Failed to create board', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-colors">
            <Layout className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-foreground">
              {currentBoard?.name || 'Select Board'}
            </span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {boards.map((board) => (
            <DropdownMenuItem
              key={board.id}
              onClick={() => onBoardChange(board.id)}
              className={currentBoard?.id === board.id ? 'bg-primary/10' : ''}
            >
              <Layout className="w-4 h-4 mr-2 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{board.name}</p>
                {board.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {board.description}
                  </p>
                )}
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create new board
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Board Name</Label>
              <Input
                id="name"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="Enter board name..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={newBoardDescription}
                onChange={(e) => setNewBoardDescription(e.target.value)}
                placeholder="Describe this board..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBoard} disabled={!newBoardName.trim() || creating}>
              {creating ? 'Creating...' : 'Create Board'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
