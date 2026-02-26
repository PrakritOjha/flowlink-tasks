import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
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
import { Calendar } from '@/components/ui/calendar';
import { Task } from '@/types/kanban';

export interface AssigneeOption {
  id: string;
  name: string;
}

const buildTaskSchema = (existingTaskTitles: string[]) =>
  z.object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(100, 'Title must be less than 100 characters')
      .refine((v) => /[a-zA-Z]/.test(v), 'Must contain at least one letter')
      .refine(
        (title) => !existingTaskTitles.includes(title.toLowerCase()),
        'A task with this name already exists on the board'
      ),
    description: z
      .string()
      .trim()
      .min(1, 'Description is required')
      .max(500, 'Description must be less than 500 characters')
      .refine((v) => /[a-zA-Z]/.test(v), 'Must contain at least one letter'),
    assigneeId: z
      .string()
      .min(1, 'Assignee is required')
      .refine((v) => v !== '_unassigned', 'Please select an assignee'),
    dueDate: z.date({ required_error: 'Due date is required' }),
    icon: z.enum(['design', 'code', 'planning', 'dependency', 'requirements']),
    column: z.string().min(1, 'Column is required'),
  });

type TaskFormData = z.infer<ReturnType<typeof buildTaskSchema>>;

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: (task: Omit<Task, 'id'>, column: string) => void;
  columns?: { id: string; title: string }[];
  defaultColumnId?: string;
  assigneeOptions?: AssigneeOption[];
  existingTaskTitles?: string[];
}

const iconOptions = [
  { value: 'design', label: 'Design' },
  { value: 'code', label: 'Code' },
  { value: 'planning', label: 'Planning' },
  { value: 'dependency', label: 'Dependency' },
  { value: 'requirements', label: 'Requirements' },
];

export const CreateTaskModal = ({
  open,
  onOpenChange,
  onCreateTask,
  columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'done', title: 'Done' },
  ],
  defaultColumnId,
  assigneeOptions = [],
  existingTaskTitles = [],
}: CreateTaskModalProps) => {
  const taskSchema = useMemo(
    () => buildTaskSchema(existingTaskTitles),
    [existingTaskTitles]
  );

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      assigneeId: '',
      icon: 'planning',
      column: defaultColumnId || columns[0]?.id || 'todo',
    },
  });

  // Update default column when it changes
  useEffect(() => {
    if (defaultColumnId) {
      form.setValue('column', defaultColumnId);
    }
  }, [defaultColumnId, form]);

  const onSubmit = (data: TaskFormData) => {
    const assigneeId = data.assigneeId && data.assigneeId !== '_unassigned' ? data.assigneeId : undefined;
    const selectedMember = assigneeOptions.find(m => m.id === assigneeId);
    const newTask: Omit<Task, 'id'> = {
      title: data.title,
      description: data.description,
      assignee: selectedMember?.name || undefined,
      assigneeId,
      dueDate: data.dueDate ? format(data.dueDate, 'yyyy-MM-dd') : undefined,
      icon: data.icon,
    };

    onCreateTask(newTask, data.column);
    form.reset({
      title: '',
      description: '',
      assigneeId: '',
      icon: 'planning',
      column: defaultColumnId || columns[0]?.id || 'todo',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Create New Task
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/90">Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter task title..."
                      className="bg-foreground/5 border-border/30 text-foreground placeholder:text-muted-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/90">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the task..."
                      className="bg-foreground/5 border-border/30 text-foreground placeholder:text-muted-foreground resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assigneeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/90">Assignee</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-foreground/5 border-border/30 text-foreground">
                          <SelectValue placeholder="Select member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_unassigned">Unassigned</SelectItem>
                        {assigneeOptions.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-foreground/90">Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal bg-foreground/5 border-border/30 hover:bg-foreground/10',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/90">Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-foreground/5 border-border/30 text-foreground">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {iconOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="column"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/90">Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-foreground/5 border-border/30 text-foreground">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {columns.map((column) => (
                          <SelectItem key={column.id} value={column.id}>
                            {column.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Create Task
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
