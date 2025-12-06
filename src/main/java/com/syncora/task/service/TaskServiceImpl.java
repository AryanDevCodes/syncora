package com.syncora.task.service;

import com.syncora.common.exception.ResourceNotFoundException;
import com.syncora.task.Task;
import com.syncora.task.dto.CreateTaskRequest;
import com.syncora.task.dto.TaskDTO;
import com.syncora.task.dto.UpdateTaskRequest;
import com.syncora.task.repository.TaskRepository;
import com.syncora.user.entity.User;
import com.syncora.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    @Override
    public TaskDTO createTask(CreateTaskRequest request, User owner) {
        log.info("Creating task for user: {}", owner.getEmail());

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority())
                .status(request.getStatus())
                .owner(owner)
                .tags(request.getTags())
                .dueDate(request.getDueDate())
                .build();

        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(Objects.requireNonNull(request.getAssigneeId()))
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getAssigneeId()));
            task.setAssignee(assignee);
        }

        Task savedTask = taskRepository.save(task);
        log.info("Task created successfully with ID: {}", savedTask.getId());

        return mapToDTO(savedTask);
    }

    @Override
    public TaskDTO updateTask(String taskId, UpdateTaskRequest request, User owner) {
        log.info("Updating task {} for user: {}", taskId, owner.getEmail());

        Task task = taskRepository.findByIdAndOwner(taskId, owner)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        if (request.getTitle() != null) {
            task.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            task.setDescription(request.getDescription());
        }
        if (request.getPriority() != null) {
            task.setPriority(request.getPriority());
        }
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }
        if (request.getTags() != null) {
            task.setTags(request.getTags());
        }
        if (request.getDueDate() != null) {
            task.setDueDate(request.getDueDate());
        }
        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(Objects.requireNonNull(request.getAssigneeId()))
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getAssigneeId()));
            task.setAssignee(assignee);
        }

        Task updatedTask = taskRepository.save(task);
        log.info("Task updated successfully: {}", taskId);

        return mapToDTO(updatedTask);
    }

    @Override
    public void deleteTask(String taskId, User owner) {
        log.info("Deleting task {} for user: {}", taskId, owner.getEmail());

        Task task = taskRepository.findByIdAndOwner(taskId, owner)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        taskRepository.delete(task);
        log.info("Task deleted successfully: {}", taskId);
    }

    @Override
    @Transactional(readOnly = true)
    public TaskDTO getTaskById(String taskId, User owner) {
        log.info("Fetching task {} for user: {}", taskId, owner.getEmail());

        Task task = taskRepository.findByIdAndOwner(taskId, owner)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        return mapToDTO(task);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getAllTasks(User owner) {
        log.info("Fetching all tasks for user: {}", owner.getEmail());

        List<Task> tasks = taskRepository.findByOwnerOrAssigneeOrderByCreatedAtDesc(owner, owner);
        return tasks.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getTasksByStatus(Task.Status status, User owner) {
        log.info("Fetching tasks with status {} for user: {}", status, owner.getEmail());

        List<Task> tasks = taskRepository.findByOwnerAndStatusOrderByCreatedAtDesc(owner, status);
        return tasks.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getTasksByPriority(Task.Priority priority, User owner) {
        log.info("Fetching tasks with priority {} for user: {}", priority, owner.getEmail());

        List<Task> tasks = taskRepository.findByOwnerAndPriorityOrderByCreatedAtDesc(owner, priority);
        return tasks.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getAssignedTasks(User assignee) {
        log.info("Fetching assigned tasks for user: {}", assignee.getEmail());

        List<Task> tasks = taskRepository.findByAssigneeOrderByCreatedAtDesc(assignee);
        return tasks.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> searchTasks(String query, User owner) {
        log.info("Searching tasks with query '{}' for user: {}", query, owner.getEmail());

        List<Task> tasks = taskRepository.searchTasks(owner, query);
        return tasks.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getTasksByTags(List<String> tags, User owner) {
        log.info("Fetching tasks with tags {} for user: {}", tags, owner.getEmail());

        List<Task> tasks = taskRepository.findByUserAndTagsIn(owner, tags);
        return tasks.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    public TaskDTO updateTaskStatus(String taskId, Task.Status status, User owner) {
        log.info("Updating task {} status to {} for user: {}", taskId, status, owner.getEmail());

        Task task = taskRepository.findByIdAndOwner(taskId, owner)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        task.setStatus(status);
        Task updatedTask = taskRepository.save(task);
        log.info("Task status updated: {} - status: {}", taskId, status);

        return mapToDTO(updatedTask);
    }

    @Override
    @Transactional(readOnly = true)
    public long getTasksCount(User owner) {
        return taskRepository.countByOwner(owner);
    }

    @Override
    @Transactional(readOnly = true)
    public long getTasksCountByStatus(Task.Status status, User owner) {
        return taskRepository.countByOwnerAndStatus(owner, status);
    }

    private TaskDTO mapToDTO(Task task) {
        TaskDTO.AssigneeInfo assigneeInfo = null;
        if (task.getAssignee() != null) {
            User assignee = task.getAssignee();
            assigneeInfo = TaskDTO.AssigneeInfo.builder()
                    .id(assignee.getId())
                    .email(assignee.getEmail())
                    .name(assignee.getFirstName() + " " + assignee.getLastName())
                    .avatar(assignee.getAvatarUrl())
                    .build();
        }

        return TaskDTO.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .priority(task.getPriority())
                .status(task.getStatus())
                .ownerId(task.getOwner().getId())
                .ownerEmail(task.getOwner().getEmail())
                .ownerName(task.getOwner().getFirstName() + " " + task.getOwner().getLastName())
                .assignee(assigneeInfo)
                .tags(task.getTags())
                .dueDate(task.getDueDate())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}
