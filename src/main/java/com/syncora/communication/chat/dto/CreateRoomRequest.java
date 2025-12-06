package com.syncora.communication.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class CreateRoomRequest {

    @Size(max = 100)
    private String name;

    private boolean isGroup = false;

    private List<@NotBlank String> memberEmails;
}
