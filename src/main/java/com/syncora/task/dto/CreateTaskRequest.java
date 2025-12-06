package com.syncora.task.dto;

import com.syncora.task.Task;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTaskRequest {
    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    private String description;

    @Builder.Default
    private Task.Priority priority = Task.Priority.MEDIUM;

    @Builder.Default
    private Task.Status status = Task.Status.TODO;

    private String assigneeId; // User ID to assign task to

    @Builder.Default
    private List<String> tags = new ArrayList<>();

    private LocalDate dueDate;
}
