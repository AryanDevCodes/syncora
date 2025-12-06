package com.syncora.communication.video.dto;

import lombok.Data;
import java.util.List;

@Data
public class CreateVideoRoomRequest {
    private String chatRoomId;           
    private String roomName;             
    private boolean recordingEnabled;    
    private List<String> participants;   
}

