package com.syncora.note.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoteDTO {
    private String id;
    private String title;
    private String content;
    private List<String> tags;
    private String color;
    private boolean starred;
    private boolean archived;
    private String ownerId;
    private String ownerEmail;
    private String ownerName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
