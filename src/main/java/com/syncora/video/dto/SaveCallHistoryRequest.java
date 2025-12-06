package com.syncora.video.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SaveCallHistoryRequest {
    private String roomId;
    private String startTime; // ISO format
    private String endTime; // ISO format
    private Integer durationSeconds;
    private Boolean wasLimitReached;
}
