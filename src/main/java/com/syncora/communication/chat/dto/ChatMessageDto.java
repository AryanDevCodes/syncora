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
public class ChatMessageDto {
    private String id;
    private String roomId;
    private String senderEmail;
    private String content;
    private String attachmentUrl;
    private String type;
    private LocalDateTime sentAt;

    // 🟢 New tracking fields
    private boolean delivered;
    private LocalDateTime deliveredAt;
    private boolean read;
    private LocalDateTime readAt;
    
    // 🟢 File attachment fields
    private String fileId;
    private String fileName;
    private Long fileSize;
    private String fileType;
}
