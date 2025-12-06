package com.syncora.task.dto;

import com.syncora.task.Task;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTaskRequest {
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    private String description;

    private Task.Priority priority;

    private Task.Status status;

    private String assigneeId;

    private List<String> tags;

    private LocalDate dueDate;
}
