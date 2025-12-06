package com.syncora.user.dto;

import lombok.Data;

@Data
public class UserDto {
    private String  userId, userEmail;
    private String firstName,lastName;
    private String avatarUrl;
    private String role;
    private String subscriptionPlan;
    private Long storageUsedBytes;



    private Boolean emailNotifications;
    private Boolean pushNotifications;
    private Boolean chatNotifications;
    private Boolean taskNotifications;


}
