import { Board } from '@/types/kanban';

export const initialBoard: Board = {
  columns: [
    {
      id: 'todo',
      title: 'To Do',
      tasks: [
        {
          id: 'task-1',
          title: 'Design UI',
          description: 'Create intuitive interface',
          assignee: 'zack',
          icon: 'design',
          dependsOn: ['task-4'],
        },
        {
          id: 'task-4',
          title: 'Backend Setup',
          description: 'Configure database',
          assignee: 'Ben',
          icon: 'code',
        },
      ],
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      tasks: [
        {
          id: 'task-2',
          title: 'Task Organization',
          description: 'Implement board structure',
          icon: 'planning',
        },
        {
          id: 'task-5',
          title: 'Dependency Feature',
          description: 'Create visual connections',
          icon: 'dependency',
        },
      ],
    },
    {
      id: 'done',
      title: 'Done',
      tasks: [
        {
          id: 'task-3',
          title: 'Requirements',
          description: 'Analyze needs',
          icon: 'requirements',
        },
        {
          id: 'task-6',
          title: 'Project Planning',
          description: 'Schedule tasks',
          icon: 'planning',
        },
      ],
    },
  ],
};
