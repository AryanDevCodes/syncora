package com.syncora.communication.video.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VideoTokenResponse {
    private String appId;
    private String channelName;
    private String rtcToken;
    private int expireIn;
    private String uid;
}
