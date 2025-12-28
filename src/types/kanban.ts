export interface Task {
  id: string;
  title: string;
  description: string;
  assignee?: string;
  dueDate?: string;
  icon: 'design' | 'code' | 'planning' | 'dependency' | 'requirements';
  dependsOn?: string[];
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

export interface Board {
  columns: Column[];
}

export interface DependencyLine {
  from: string;
  to: string;
}
