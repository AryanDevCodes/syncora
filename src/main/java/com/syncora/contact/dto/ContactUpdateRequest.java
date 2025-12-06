package com.syncora.contact.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ContactUpdateRequest {
    @Size(max = 100)
    private String name;

    @Email
    @Size(max = 100)
    private String email;

    @Size(max = 15)
    private String phone;

    @Size(max = 100)
    private String organization;

    @Size(max = 100)
    private String position;

    @Size(max = 200)
    private String address;

    @Size(max = 200)
    private String website;

    @Size(max = 50)
    private String secondaryPhone;

    @Size(max = 200)
    private String linkedinUrl;

    @Size(max = 100)
    private String twitterHandle;

    @Size(max = 100)
    private String tags;

    @Size(max = 100)
    private String department;

    @Size(max = 100)
    private String managerName;

    @Size(max = 50)
    private String employeeId;

    private LocalDate startDate;

    @Size(max = 100)
    private String industry;

    private LocalDate birthday;

    private LocalDate anniversary;

    @Size(max = 100)
    private String nickname;

    @Size(max = 500)
    private String note;

    private String avatarUrl;
}
