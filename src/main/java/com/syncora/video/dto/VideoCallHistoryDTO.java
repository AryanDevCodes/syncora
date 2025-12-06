package com.syncora.video.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class VideoCallHistoryDTO {
    private String id;
    private String userId;
    private String roomId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationSeconds;
    private String planAtCallTime;
    private Integer timeLimitSeconds;
    private Boolean wasLimitReached;
    private LocalDateTime createdAt;
}
