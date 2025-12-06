package com.syncora.communication.chat.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MessageSendRequest {
    private String roomId;
    @NotBlank
    private String content;
    private String attachmentUrl; // optional
    private String type; // TEXT or FILE
    
    // File attachment fields
    private String fileId;
    private String fileName;
    private Long fileSize;
    private String fileType;
}
