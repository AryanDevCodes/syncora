package com.syncora.user.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateUserRequest {

    @Size(max = 100)
    private String firstName;

    @Size(max = 100)
    private String lastName;
                
    @Size(max = 1000)
    private String avatarUrl;

    // Notification settings
    private Boolean emailNotifications;
    private Boolean pushNotifications;
    private Boolean chatNotifications;
    private Boolean taskNotifications;
}
