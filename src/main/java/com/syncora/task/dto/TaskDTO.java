package com.syncora.task.dto;

import com.syncora.task.Task;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskDTO {
    private String id;
    private String title;
    private String description;
    private Task.Priority priority;
    private Task.Status status;
    private String ownerId;
    private String ownerEmail;
    private String ownerName;
    private AssigneeInfo assignee;
    private List<String> tags;
    private LocalDate dueDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssigneeInfo {
        private String id;
        private String email;
        private String name;
        private String avatar;
    }
}
