package com.syncora.note.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateNoteRequest {
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    private String content;

    private List<String> tags;

    private String color;

    private Boolean starred;

    private Boolean archived;
}
