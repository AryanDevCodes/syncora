package com.syncora.task.controller;

import com.syncora.common.exception.ResourceNotFoundException;
import com.syncora.common.response.ApiResponse;
import com.syncora.security.JwtProvider;
import com.syncora.task.Task;
import com.syncora.task.dto.CreateTaskRequest;
import com.syncora.task.dto.TaskDTO;
import com.syncora.task.dto.UpdateTaskRequest;
import com.syncora.task.service.TaskService;
import com.syncora.user.entity.User;
import com.syncora.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@Tag(name = "Tasks", description = "Task management endpoints")
public class TaskController {

    private final TaskService taskService;
    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;

    private User getCurrentUser(HttpServletRequest req) {
        String token = req.getHeader("Authorization");
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        String email = jwtProvider.extractEmail(token);
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @PostMapping
    @Operation(summary = "Create a new task", description = "Creates a new task for the authenticated user")
    public ResponseEntity<ApiResponse<TaskDTO>> createTask(
            HttpServletRequest req,
            @Valid @RequestBody CreateTaskRequest request) {
        User user = getCurrentUser(req);
        TaskDTO task = taskService.createTask(request, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Task created successfully", task));
    }

    @PutMapping("/{taskId}")
    @Operation(summary = "Update a task", description = "Updates an existing task")
    public ResponseEntity<ApiResponse<TaskDTO>> updateTask(
            HttpServletRequest req,
            @PathVariable String taskId,
            @Valid @RequestBody UpdateTaskRequest request) {
        User user = getCurrentUser(req);
        TaskDTO task = taskService.updateTask(taskId, request, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Task updated successfully", task));
    }

    @DeleteMapping("/{taskId}")
    @Operation(summary = "Delete a task", description = "Deletes a task")
    public ResponseEntity<ApiResponse<Void>> deleteTask(
            HttpServletRequest req,
            @PathVariable String taskId) {
        User user = getCurrentUser(req);
        taskService.deleteTask(taskId, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Task deleted successfully", null));
    }

    @GetMapping("/{taskId}")
    @Operation(summary = "Get task by ID", description = "Retrieves a specific task")
    public ResponseEntity<ApiResponse<TaskDTO>> getTaskById(
            HttpServletRequest req,
            @PathVariable String taskId) {
        User user = getCurrentUser(req);
        TaskDTO task = taskService.getTaskById(taskId, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Task retrieved successfully", task));
    }

    @GetMapping
    @Operation(summary = "Get all tasks", description = "Retrieves all tasks for the user")
    public ResponseEntity<ApiResponse<List<TaskDTO>>> getAllTasks(HttpServletRequest req) {
        User user = getCurrentUser(req);
        List<TaskDTO> tasks = taskService.getAllTasks(user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Tasks retrieved successfully", tasks));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Get tasks by status", description = "Retrieves tasks filtered by status")
    public ResponseEntity<ApiResponse<List<TaskDTO>>> getTasksByStatus(
            HttpServletRequest req,
            @PathVariable Task.Status status) {
        User user = getCurrentUser(req);
        List<TaskDTO> tasks = taskService.getTasksByStatus(status, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Tasks retrieved by status", tasks));
    }

    @GetMapping("/priority/{priority}")
    @Operation(summary = "Get tasks by priority", description = "Retrieves tasks filtered by priority")
    public ResponseEntity<ApiResponse<List<TaskDTO>>> getTasksByPriority(
            HttpServletRequest req,
            @PathVariable Task.Priority priority) {
        User user = getCurrentUser(req);
        List<TaskDTO> tasks = taskService.getTasksByPriority(priority, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Tasks retrieved by priority", tasks));
    }

    @GetMapping("/assigned")
    @Operation(summary = "Get assigned tasks", description = "Retrieves tasks assigned to the user")
    public ResponseEntity<ApiResponse<List<TaskDTO>>> getAssignedTasks(HttpServletRequest req) {
        User user = getCurrentUser(req);
        List<TaskDTO> tasks = taskService.getAssignedTasks(user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Assigned tasks retrieved", tasks));
    }

    @GetMapping("/search")
    @Operation(summary = "Search tasks", description = "Searches tasks by title or description")
    public ResponseEntity<ApiResponse<List<TaskDTO>>> searchTasks(
            HttpServletRequest req,
            @RequestParam String query) {
        User user = getCurrentUser(req);
        List<TaskDTO> tasks = taskService.searchTasks(query, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Tasks search completed", tasks));
    }

    @GetMapping("/tags")
    @Operation(summary = "Get tasks by tags", description = "Retrieves tasks filtered by tags")
    public ResponseEntity<ApiResponse<List<TaskDTO>>> getTasksByTags(
            HttpServletRequest req,
            @RequestParam List<String> tags) {
        User user = getCurrentUser(req);
        List<TaskDTO> tasks = taskService.getTasksByTags(tags, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Tasks retrieved by tags", tasks));
    }

    @PatchMapping("/{taskId}/status")
    @Operation(summary = "Update task status", description = "Updates the status of a task")
    public ResponseEntity<ApiResponse<TaskDTO>> updateTaskStatus(
            HttpServletRequest req,
            @PathVariable String taskId,
            @RequestBody Map<String, String> body) {
        User user = getCurrentUser(req);
        Task.Status status = Task.Status.valueOf(body.get("status").toUpperCase().replace("-", "_"));
        TaskDTO task = taskService.updateTaskStatus(taskId, status, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Task status updated", task));
    }

    @GetMapping("/count")
    @Operation(summary = "Get tasks count", description = "Returns the count of all tasks")
    public ResponseEntity<ApiResponse<Long>> getTasksCount(HttpServletRequest req) {
        User user = getCurrentUser(req);
        long count = taskService.getTasksCount(user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Tasks count retrieved", count));
    }

    @GetMapping("/count/status/{status}")
    @Operation(summary = "Get tasks count by status", description = "Returns the count of tasks by status")
    public ResponseEntity<ApiResponse<Long>> getTasksCountByStatus(
            HttpServletRequest req,
            @PathVariable Task.Status status) {
        User user = getCurrentUser(req);
        long count = taskService.getTasksCountByStatus(status, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Tasks count by status retrieved", count));
    }
}
