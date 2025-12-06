package com.syncora.email.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailComposeRequest {
    
    @NotEmpty(message = "At least one recipient is required")
    private List<String> to;
    
    private List<String> cc;
    private List<String> bcc;
    
    @NotNull(message = "Subject is required")
    private String subject;
    
    @NotNull(message = "Body is required")
    private String body;
    
    private String htmlBody;
    private Boolean isDraft;
}
