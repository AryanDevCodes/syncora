package com.syncora.communication.chat.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class ChatRoomDto {
    private String id;
    private String name;
    private boolean isGroup;
    private List<String> memberEmails;
    private String ownerEmail;
    private LocalDateTime createdAt;

    private long unreadCount;
    private String lastMessagePreview;
    private boolean canRename;
    private boolean canDelete;
    private boolean visible;

    private LocalDateTime lastMessageTime;

}
