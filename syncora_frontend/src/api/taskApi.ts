import axiosInstance from '@/lib/axios';

const BASE_URL = '/tasks';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export interface AssigneeInfo {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface TaskDTO {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  assignee?: AssigneeInfo;
  tags: string[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigneeId?: string;
  tags?: string[];
  dueDate?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigneeId?: string;
  tags?: string[];
  dueDate?: string;
}

// Get all tasks
export const getAllTasks = async (): Promise<TaskDTO[]> => {
  const response = await axiosInstance.get(BASE_URL);
  return response.data.data;
};

// Get task by ID
export const getTaskById = async (id: string): Promise<TaskDTO> => {
  const response = await axiosInstance.get(`${BASE_URL}/${id}`);
  return response.data.data;
};

// Get tasks by status
export const getTasksByStatus = async (status: TaskStatus): Promise<TaskDTO[]> => {
  const response = await axiosInstance.get(`${BASE_URL}/status/${status}`);
  return response.data.data;
};

// Get tasks by priority
export const getTasksByPriority = async (priority: TaskPriority): Promise<TaskDTO[]> => {
  const response = await axiosInstance.get(`${BASE_URL}/priority/${priority}`);
  return response.data.data;
};

// Get assigned tasks
export const getAssignedTasks = async (): Promise<TaskDTO[]> => {
  const response = await axiosInstance.get(`${BASE_URL}/assigned`);
  return response.data.data;
};

// Create a new task
export const createTask = async (task: CreateTaskRequest): Promise<TaskDTO> => {
  const response = await axiosInstance.post(BASE_URL, task);
  return response.data.data;
};

// Update a task
export const updateTask = async (id: string, task: UpdateTaskRequest): Promise<TaskDTO> => {
  const response = await axiosInstance.put(`${BASE_URL}/${id}`, task);
  return response.data.data;
};

// Delete a task
export const deleteTask = async (id: string): Promise<void> => {
  await axiosInstance.delete(`${BASE_URL}/${id}`);
};

// Search tasks
export const searchTasks = async (query: string): Promise<TaskDTO[]> => {
  const response = await axiosInstance.get(`${BASE_URL}/search`, {
    params: { query }
  });
  return response.data.data;
};

// Get tasks by tags
export const getTasksByTags = async (tags: string[]): Promise<TaskDTO[]> => {
  const response = await axiosInstance.get(`${BASE_URL}/tags`, {
    params: { tags }
  });
  return response.data.data;
};

// Update task status
export const updateTaskStatus = async (id: string, status: TaskStatus): Promise<TaskDTO> => {
  const response = await axiosInstance.patch(`${BASE_URL}/${id}/status`, { status });
  return response.data.data;
};

// Get tasks count
export const getTasksCount = async (): Promise<number> => {
  const response = await axiosInstance.get(`${BASE_URL}/count`);
  return response.data.data;
};

// Get tasks count by status
export const getTasksCountByStatus = async (status: TaskStatus): Promise<number> => {
  const response = await axiosInstance.get(`${BASE_URL}/count/status/${status}`);
  return response.data.data;
};

export const taskApi = {
  getAllTasks,
  getTaskById,
  getTasksByStatus,
  getTasksByPriority,
  getAssignedTasks,
  createTask,
  updateTask,
  deleteTask,
  searchTasks,
  getTasksByTags,
  updateTaskStatus,
  getTasksCount,
  getTasksCountByStatus,
};
