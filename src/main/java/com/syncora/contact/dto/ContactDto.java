package com.syncora.contact.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ContactDto {
    private String id;
    private String name;
    private String email;
    private String phone;
    private String organization;
    private String position;
    private String address;
    private String website;
    private String secondaryPhone;
    private String linkedinUrl;
    private String twitterHandle;
    private String tags;
    private String department;
    private String managerName;
    private String employeeId;
    private LocalDate startDate;
    private String industry;
    private LocalDate birthday;
    private LocalDate anniversary;
    private String nickname;
    private String avatarUrl;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
