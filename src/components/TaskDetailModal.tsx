import { useState, useEffect } from 'react';
import { Task, Column } from '@/types/kanban';
import { useAuth } from '@/hooks/useAuth';
import { fetchComments, createComment, DbComment } from '@/lib/database/comments';
import { createDependency, deleteDependency, DbTaskDependency } from '@/lib/database';
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
}

const iconMap = {
  design: Pencil,
  code: ListTree,
  planning: Calendar,
  dependency: Link2,
  requirements: ClipboardCheck,
};

export const TaskDetailModal = ({
  open,
  onOpenChange,
  task,
  allTasks,
  columns,
  dependencies,
  onDependencyChange,
}: TaskDetailModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<DbComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [selectedDependency, setSelectedDependency] = useState<string>('');
  const [addingDependency, setAddingDependency] = useState(false);

  useEffect(() => {
    if (task && open) {
      loadComments();
    }
  }, [task, open]);

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

  const Icon = iconMap[task.icon];
  const currentColumn = columns.find(c => c.tasks.some(t => t.id === task.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{task.title}</DialogTitle>
              {currentColumn && (
                <Badge variant="secondary" className="mt-1">
                  {currentColumn.title}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Description */}
            {task.description && (
              <div>
                <p className="text-muted-foreground">{task.description}</p>
              </div>
            )}

            {/* Meta info */}
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
                    <div key={comment.id} className="p-3 rounded-lg bg-muted/30">
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
