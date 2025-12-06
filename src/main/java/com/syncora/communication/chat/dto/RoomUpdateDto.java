package com.syncora.communication.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomUpdateDto {
    private String roomId;
    private String roomName;
    private boolean isGroup;
    private String lastMessagePreview;
    private LocalDateTime lastMessageTime;
    private long unreadCount;
    private List<String> memberEmails;
}
