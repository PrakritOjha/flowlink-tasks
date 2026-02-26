import { useState, useEffect } from 'react';
import { Task, Column } from '@/types/kanban';
import { useAuth } from '@/hooks/useAuth';
import { fetchComments, createComment, DbComment } from '@/lib/database/comments';
import { createDependency, deleteDependency, updateTask, deleteTask, DbTaskDependency } from '@/lib/database';
import { AssigneeOption } from './CreateTaskModal';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarWidget } from '@/components/ui/calendar';
import {
  MessageSquare,
  Link2,
  Plus,
  X,
  Send,
  Calendar,
  User,
  Pencil,
  ListTree,
  ClipboardCheck,
  CalendarIcon,
  Check,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TaskDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  allTasks: Task[];
  columns: Column[];
  dependencies: DbTaskDependency[];
  onDependencyChange: () => void;
  onTaskUpdate?: () => void;
  onTaskDelete?: () => void;
  assigneeOptions?: AssigneeOption[];
}

const iconMap = {
  design: Pencil,
  code: ListTree,
  planning: Calendar,
  dependency: Link2,
  requirements: ClipboardCheck,
};

const iconOptions = [
  { value: 'design', label: 'Design' },
  { value: 'code', label: 'Code' },
  { value: 'planning', label: 'Planning' },
  { value: 'dependency', label: 'Dependency' },
  { value: 'requirements', label: 'Requirements' },
];

export const TaskDetailModal = ({
  open,
  onOpenChange,
  task,
  allTasks,
  columns,
  dependencies,
  onDependencyChange,
  onTaskUpdate,
  onTaskDelete,
  assigneeOptions = [],
}: TaskDetailModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<DbComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [selectedDependency, setSelectedDependency] = useState<string>('');
  const [addingDependency, setAddingDependency] = useState(false);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitleError, setEditTitleError] = useState('');
  const [editDescriptionError, setEditDescriptionError] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAssigneeId, setEditAssigneeId] = useState('');
  const [editDueDate, setEditDueDate] = useState<Date | undefined>(undefined);
  const [editIcon, setEditIcon] = useState<Task['icon']>('planning');
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (task && open) {
      loadComments();
    }
    if (!open) {
      setIsEditing(false);
      setConfirmingDelete(false);
    }
  }, [task, open]);

  const enterEditMode = () => {
    if (!task) return;
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditAssigneeId(task.assigneeId || '_unassigned');
    setEditDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
    setEditIcon(task.icon);
    setIsEditing(true);
    setConfirmingDelete(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setConfirmingDelete(false);
  };

  const handleSave = async () => {
    if (!task) return;
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      setEditTitleError('Title is required');
      return;
    }
    if (!/[a-zA-Z]/.test(trimmedTitle)) {
      setEditTitleError('Must contain at least one letter');
      return;
    }
    setEditTitleError('');
    const trimmedDesc = editDescription.trim();
    if (trimmedDesc && !/[a-zA-Z]/.test(trimmedDesc)) {
      setEditDescriptionError('Must contain at least one letter');
      return;
    }
    setEditDescriptionError('');
    setSaving(true);
    try {
      const assigneeId = editAssigneeId && editAssigneeId !== '_unassigned' ? editAssigneeId : null;
      const selectedMember = assigneeOptions.find(m => m.id === assigneeId);
      await updateTask(task.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        assignee_id: assigneeId,
        assignee_name: selectedMember?.name || null,
        due_date: editDueDate ? format(editDueDate, 'yyyy-MM-dd') : null,
        icon: editIcon,
      });
      setIsEditing(false);
      toast({ title: 'Task updated' });
      onTaskUpdate?.();
    } catch (error) {
      toast({ title: 'Failed to update task', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    try {
      await deleteTask(task.id);
      toast({ title: 'Task deleted' });
      onOpenChange(false);
      onTaskDelete?.();
    } catch (error) {
      toast({ title: 'Failed to delete task', variant: 'destructive' });
    }
    setConfirmingDelete(false);
  };

  const loadComments = async () => {
    if (!task) return;
    setLoadingComments(true);
    try {
      const data = await fetchComments(task.id);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!task || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const comment = await createComment(task.id, newComment.trim());
      setComments(prev => [...prev, comment]);
      setNewComment('');
      toast({ title: 'Comment added' });
    } catch (error) {
      toast({ title: 'Failed to add comment', variant: 'destructive' });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAddDependency = async () => {
    if (!task || !selectedDependency) return;

    setAddingDependency(true);
    try {
      await createDependency(task.id, selectedDependency);
      setSelectedDependency('');
      onDependencyChange();
      toast({ title: 'Dependency added' });
    } catch (error) {
      toast({ title: 'Failed to add dependency', variant: 'destructive' });
    } finally {
      setAddingDependency(false);
    }
  };

  const handleRemoveDependency = async (dependencyId: string) => {
    try {
      await deleteDependency(dependencyId);
      onDependencyChange();
      toast({ title: 'Dependency removed' });
    } catch (error) {
      toast({ title: 'Failed to remove dependency', variant: 'destructive' });
    }
  };

  if (!task) return null;

  const taskDependencies = dependencies.filter(d => d.task_id === task.id);
  const dependsOnTasks = taskDependencies.map(d =>
    allTasks.find(t => t.id === d.depends_on_task_id)
  ).filter(Boolean) as Task[];

  const availableTasks = allTasks.filter(
    t => t.id !== task.id && !taskDependencies.some(d => d.depends_on_task_id === t.id)
  );

  const Icon = iconMap[isEditing ? editIcon : task.icon];
  const currentColumn = columns.find(c => c.tasks.some(t => t.id === task.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div>
                  <Input
                    value={editTitle}
                    onChange={(e) => { setEditTitle(e.target.value); setEditTitleError(''); }}
                    className="text-xl font-semibold"
                    placeholder="Task title"
                  />
                  {editTitleError && <p className="text-sm text-destructive mt-1">{editTitleError}</p>}
                </div>
              ) : (
                <DialogTitle className="text-xl">{task.title}</DialogTitle>
              )}
              {currentColumn && !isEditing && (
                <Badge variant="secondary" className="mt-1">
                  {currentColumn.title}
                </Badge>
              )}
            </div>
            {!isEditing && (
              <Button variant="ghost" size="icon" onClick={enterEditMode} className="shrink-0">
                <Pencil className="w-4 h-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Description */}
            {isEditing ? (
              <div>
                <label className="text-sm font-medium text-foreground/90 mb-1.5 block">Description</label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => { setEditDescription(e.target.value); setEditDescriptionError(''); }}
                  placeholder="Add a description..."
                  className="resize-none"
                  rows={3}
                />
                {editDescriptionError && <p className="text-sm text-destructive mt-1">{editDescriptionError}</p>}
              </div>
            ) : task.description ? (
              <div>
                <p className="text-muted-foreground">{task.description}</p>
              </div>
            ) : null}

            {/* Meta info / Editable fields */}
            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground/90 mb-1.5 block">Assignee</label>
                  <Select value={editAssigneeId} onValueChange={setEditAssigneeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_unassigned">Unassigned</SelectItem>
                      {assigneeOptions.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-foreground/90 mb-1.5 block">Due Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !editDueDate && 'text-muted-foreground'
                        )}
                      >
                        {editDueDate ? format(editDueDate, 'PPP') : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarWidget
                        mode="single"
                        selected={editDueDate}
                        onSelect={setEditDueDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground/90 mb-1.5 block">Category</label>
                  <Select value={editIcon} onValueChange={(v) => setEditIcon(v as Task['icon'])}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4 text-sm">
                {task.assignee && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>{task.assignee}</span>
                  </div>
                )}
                {task.dueDate && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            )}

            {/* Edit actions */}
            {isEditing && (
              <div className="flex items-center gap-2">
                <Button onClick={handleSave} disabled={!editTitle.trim() || saving} size="sm">
                  <Check className="w-4 h-4 mr-1" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="ghost" onClick={cancelEdit} size="sm">
                  Cancel
                </Button>
                <div className="flex-1" />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  {confirmingDelete ? 'Confirm?' : 'Delete'}
                </Button>
              </div>
            )}

            {/* Dependencies Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold">Dependencies</h3>
              </div>

              {dependsOnTasks.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {dependsOnTasks.map(depTask => {
                    const dep = taskDependencies.find(d => d.depends_on_task_id === depTask.id);
                    return (
                      <Badge
                        key={depTask.id}
                        variant="outline"
                        className="flex items-center gap-1 pr-1"
                      >
                        {depTask.title}
                        <button
                          onClick={() => dep && handleRemoveDependency(dep.id)}
                          className="p-0.5 hover:bg-destructive/20 rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No dependencies</p>
              )}

              {availableTasks.length > 0 && (
                <div className="flex gap-2">
                  <Select value={selectedDependency} onValueChange={setSelectedDependency}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select task to depend on..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTasks.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={handleAddDependency}
                    disabled={!selectedDependency || addingDependency}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold">Comments ({comments.length})</h3>
              </div>

              {loadingComments ? (
                <p className="text-sm text-muted-foreground">Loading comments...</p>
              ) : comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.map(comment => (
                    <div key={comment.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {comment.user_id === user?.id ? 'You' : 'Team member'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No comments yet</p>
              )}

              <div className="flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="min-h-[80px]"
                />
              </div>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submittingComment}
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                {submittingComment ? 'Sending...' : 'Send Comment'}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
