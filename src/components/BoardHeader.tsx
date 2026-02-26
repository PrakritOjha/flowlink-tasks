import { useState, useMemo } from 'react';
import { Crown, Eye, Filter, MoreHorizontal, Pencil, Trash2, UserPlus, X } from 'lucide-react';
import { useBoard } from '@/hooks/useBoard';
import { useBoardMembers } from '@/hooks/useBoardMembers';
import { BoardSwitcher } from './BoardSwitcher';
import { TeamManagementModal } from './TeamManagementModal';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export const BoardHeader = () => {
  const {
    boards, currentBoard, columns, tasks, dependencies,
    switchBoard, handleCreateBoard, handleUpdateBoard, handleDeleteBoard,
    filterAssignee, setFilterAssignee, filterStatus, setFilterStatus,
    isOwner, currentUserRole,
  } = useBoard();
  const { members } = useBoardMembers(currentBoard?.id || null);
  const { toast } = useToast();
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState('');
  const [saving, setSaving] = useState(false);

  const openRenameModal = () => {
    setNewName(currentBoard?.name || '');
    setRenameModalOpen(true);
  };

  const handleRename = async () => {
    if (!currentBoard || !newName.trim()) {
      setNameError('Board name is required');
      return;
    }
    if (!/[a-zA-Z]/.test(newName.trim())) {
      setNameError('Must contain at least one letter');
      return;
    }
    setNameError('');
    setSaving(true);
    try {
      await handleUpdateBoard(currentBoard.id, { name: newName.trim() });
      setRenameModalOpen(false);
      toast({ title: 'Board renamed' });
    } catch {
      toast({ title: 'Failed to rename board', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentBoard) return;
    setSaving(true);
    try {
      await handleDeleteBoard(currentBoard.id);
      setDeleteModalOpen(false);
      toast({ title: 'Board deleted' });
    } catch {
      toast({ title: 'Failed to delete board', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Unique assignee names from tasks for the filter dropdown
  const assigneeOptions = useMemo(() => {
    const names = new Set<string>();
    tasks.forEach(t => {
      if (t.assignee_name) names.add(t.assignee_name);
    });
    return Array.from(names).sort();
  }, [tasks]);

  const activeFilterCount = (filterAssignee ? 1 : 0) + (filterStatus ? 1 : 0);

  const clearFilters = () => {
    setFilterAssignee(null);
    setFilterStatus(null);
  };

  const totalTasks = tasks.length;
  const totalDependencies = dependencies.length;

  const avatarColors = ['bg-blue-500', 'bg-violet-500', 'bg-teal-500', 'bg-rose-500'];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4">
        <div className="space-y-1.5 min-w-0">
          <BoardSwitcher
            boards={boards}
            currentBoard={currentBoard}
            onBoardChange={switchBoard}
            onCreateBoard={handleCreateBoard}
            canCreateBoard={isOwner}
          />
          <div className="flex items-center gap-2">
            <p className="text-xs sm:text-sm text-muted-foreground">
              {columns.length} columns · {totalTasks} tasks · {totalDependencies} dependencies
            </p>
            {currentUserRole && (
              <Badge
                className={
                  currentUserRole === 'owner'
                    ? 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100'
                    : currentUserRole === 'editor'
                    ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100'
                    : currentUserRole === 'admin'
                    ? 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100'
                    : 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100'
                }
              >
                {currentUserRole === 'owner' && <Crown className="w-3 h-3 mr-1" />}
                {currentUserRole === 'editor' && <Pencil className="w-3 h-3 mr-1" />}
                {currentUserRole === 'admin' && <Crown className="w-3 h-3 mr-1" />}
                {currentUserRole === 'viewer' && <Eye className="w-3 h-3 mr-1" />}
                {currentUserRole.charAt(0).toUpperCase() + currentUserRole.slice(1)}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="flex -space-x-2">
            {members.slice(0, 3).map((member, i) => (
              <div
                key={member.id}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] sm:text-xs font-semibold text-white ${avatarColors[i % avatarColors.length]}`}
                title={member.profile?.display_name || 'Team member'}
              >
                {member.profile?.display_name?.slice(0, 2).toUpperCase() || 'TM'}
              </div>
            ))}
            {members.length > 3 && (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] sm:text-xs font-medium text-gray-600">
                +{members.length - 3}
              </div>
            )}
            <button
              onClick={() => setTeamModalOpen(true)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-colors"
              title="Manage team"
            >
              <UserPlus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
            </button>
          </div>

          {/* Filter popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground relative">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filter</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Filters</h4>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-xs text-primary hover:underline">
                    Clear all
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Assignee</Label>
                <Select
                  value={filterAssignee ?? '_all'}
                  onValueChange={(v) => setFilterAssignee(v === '_all' ? null : v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All members" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">All members</SelectItem>
                    <SelectItem value="_unassigned">Unassigned</SelectItem>
                    {assigneeOptions.map(name => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select
                  value={filterStatus ?? '_all'}
                  onValueChange={(v) => setFilterStatus(v === '_all' ? null : v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">All statuses</SelectItem>
                    {columns.map(col => (
                      <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>

          {/* Active filter pills (visible inline) */}
          {activeFilterCount > 0 && (
            <div className="hidden sm:flex items-center gap-1">
              {filterAssignee && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {filterAssignee === '_unassigned' ? 'Unassigned' : filterAssignee}
                  <button onClick={() => setFilterAssignee(null)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterStatus && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {columns.find(c => c.id === filterStatus)?.title}
                  <button onClick={() => setFilterStatus(null)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={openRenameModal}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Rename board
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteModalOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete board
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <TeamManagementModal
        open={teamModalOpen}
        onOpenChange={setTeamModalOpen}
        board={currentBoard}
      />

      <Dialog open={renameModalOpen} onOpenChange={setRenameModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Board</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="board-name">Board Name</Label>
            <Input
              id="board-name"
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setNameError(''); }}
              placeholder="Enter board name..."
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); }}
            />
            {nameError && <p className="text-sm text-destructive mt-1">{nameError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!newName.trim() || saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Board</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{currentBoard?.name}"? All columns, tasks, and dependencies in this board will be permanently removed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
