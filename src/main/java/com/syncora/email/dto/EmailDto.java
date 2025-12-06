package com.syncora.email.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailDto {
    private String id;
    private String from;
    private String fromName;
    private List<String> to;
    private List<String> cc;
    private List<String> bcc;
    private String subject;
    private String body;
    private String htmlBody;
    private Boolean isRead;
    private Boolean isStarred;
    private String folder;
    private Set<String> labels;
    private List<EmailAttachmentDto> attachments;
    private LocalDateTime sentAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
