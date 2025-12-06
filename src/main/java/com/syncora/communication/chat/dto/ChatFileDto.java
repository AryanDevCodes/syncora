package com.syncora.communication.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatFileDto {
    private String id;
    private String messageId;
    private String fileName;
    private Long fileSize;
    private String fileType;
    private String uploadedBy;
    private LocalDateTime uploadedAt;
    private String downloadUrl; // URL to download the file
}
