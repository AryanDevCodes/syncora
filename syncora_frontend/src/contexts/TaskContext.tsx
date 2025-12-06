import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { taskApi, TaskDTO, CreateTaskRequest, TaskStatus, TaskPriority } from '@/api/taskApi';
import { useToast } from '@/hooks/use-toast';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in-progress' | 'review' | 'done';
  assignee: {
    id: string;
    name: string;
    avatar?: string;
  };
  tags?: string[];
  dueDate?: Date;
  createdAt: Date;
}

interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  fetchTasks: () => Promise<void>;
  moveTask: (taskId: string, newStatus: Task['status']) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

// Convert backend DTO to frontend Task
const convertDTOToTask = (dto: TaskDTO): Task => {
  const priorityMap: Record<TaskPriority, 'high' | 'medium' | 'low'> = {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
  };

  const statusMap: Record<TaskStatus, 'todo' | 'in-progress' | 'review' | 'done'> = {
    TODO: 'todo',
    IN_PROGRESS: 'in-progress',
    REVIEW: 'review',
    DONE: 'done',
  };

  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    priority: priorityMap[dto.priority],
    status: statusMap[dto.status],
    assignee: dto.assignee || {
      id: dto.ownerId,
      name: dto.ownerName,
      avatar: undefined,
    },
    tags: dto.tags,
    dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    createdAt: new Date(dto.createdAt),
  };
};

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const fetchedTasks = await taskApi.getAllTasks();
      setTasks(fetchedTasks.map(convertDTOToTask));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tasks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const moveTask = async (taskId: string, newStatus: Task['status']) => {
    const statusMap: Record<Task['status'], TaskStatus> = {
      'todo': 'TODO',
      'in-progress': 'IN_PROGRESS',
      'review': 'REVIEW',
      'done': 'DONE',
    };

    try {
      const updatedTask = await taskApi.updateTaskStatus(taskId, statusMap[newStatus]);
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? convertDTOToTask(updatedTask) : task))
      );
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task status',
        variant: 'destructive',
      });
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const priorityMap: Record<'high' | 'medium' | 'low', TaskPriority> = {
        high: 'HIGH',
        medium: 'MEDIUM',
        low: 'LOW',
      };

      const statusMap: Record<Task['status'], TaskStatus> = {
        'todo': 'TODO',
        'in-progress': 'IN_PROGRESS',
        'review': 'REVIEW',
        'done': 'DONE',
      };

      const updateRequest: any = {};
      if (updates.title) updateRequest.title = updates.title;
      if (updates.description !== undefined) updateRequest.description = updates.description;
      if (updates.priority) updateRequest.priority = priorityMap[updates.priority];
      if (updates.status) updateRequest.status = statusMap[updates.status];
      if (updates.tags) updateRequest.tags = updates.tags;
      if (updates.dueDate) updateRequest.dueDate = updates.dueDate.toISOString().split('T')[0];

      const updatedTask = await taskApi.updateTask(taskId, updateRequest);
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? convertDTOToTask(updatedTask) : task))
      );
      
      toast({
        title: 'Success',
        description: 'Task updated successfully',
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
    }
  };

  const addTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
    try {
      const priorityMap: Record<'high' | 'medium' | 'low', TaskPriority> = {
        high: 'HIGH',
        medium: 'MEDIUM',
        low: 'LOW',
      };

      const statusMap: Record<Task['status'], TaskStatus> = {
        'todo': 'TODO',
        'in-progress': 'IN_PROGRESS',
        'review': 'REVIEW',
        'done': 'DONE',
      };

      const createRequest: CreateTaskRequest = {
        title: task.title,
        description: task.description,
        priority: priorityMap[task.priority],
        status: statusMap[task.status],
        tags: task.tags,
        dueDate: task.dueDate?.toISOString().split('T')[0],
      };

      const createdTask = await taskApi.createTask(createRequest);
      setTasks((prev) => [convertDTOToTask(createdTask), ...prev]);
      
      toast({
        title: 'Success',
        description: 'Task created successfully',
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await taskApi.deleteTask(taskId);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      
      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
    }
  };

  return (
    <TaskContext.Provider value={{ tasks, loading, fetchTasks, moveTask, updateTask, addTask, deleteTask }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTasks must be used within TaskProvider');
  return context;
};
