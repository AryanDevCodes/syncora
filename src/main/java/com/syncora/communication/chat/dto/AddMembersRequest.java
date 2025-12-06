package com.syncora.communication.chat.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class AddMembersRequest {


    private String roomId;

    @NotEmpty
    private List<String> newMembers; // list of emails to add
}
