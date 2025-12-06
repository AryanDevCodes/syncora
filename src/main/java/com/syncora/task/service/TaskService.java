package com.syncora.task.service;

import com.syncora.task.Task;
import com.syncora.task.dto.CreateTaskRequest;
import com.syncora.task.dto.TaskDTO;
import com.syncora.task.dto.UpdateTaskRequest;
import com.syncora.user.entity.User;

import java.util.List;

public interface TaskService {
    
    TaskDTO createTask(CreateTaskRequest request, User owner);
    
    TaskDTO updateTask(String taskId, UpdateTaskRequest request, User owner);
    
    void deleteTask(String taskId, User owner);
    
    TaskDTO getTaskById(String taskId, User owner);
    
    List<TaskDTO> getAllTasks(User owner);
    
    List<TaskDTO> getTasksByStatus(Task.Status status, User owner);
    
    List<TaskDTO> getTasksByPriority(Task.Priority priority, User owner);
    
    List<TaskDTO> getAssignedTasks(User assignee);
    
    List<TaskDTO> searchTasks(String query, User owner);
    
    List<TaskDTO> getTasksByTags(List<String> tags, User owner);
    
    TaskDTO updateTaskStatus(String taskId, Task.Status status, User owner);
    
    long getTasksCount(User owner);
    
    long getTasksCountByStatus(Task.Status status, User owner);
}
