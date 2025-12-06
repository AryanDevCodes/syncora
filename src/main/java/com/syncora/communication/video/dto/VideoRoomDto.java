package com.syncora.communication.video.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class VideoRoomDto {

    private String id;
    private String chatRoomId;
    private String roomName;
    private boolean recordingEnabled;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private String endedBy;
    private List<String> participants;
}