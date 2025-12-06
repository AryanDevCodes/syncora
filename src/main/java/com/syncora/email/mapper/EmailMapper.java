package com.syncora.email.mapper;

import com.syncora.email.dto.EmailAttachmentDto;
import com.syncora.email.dto.EmailDto;
import com.syncora.email.entity.Email;
import com.syncora.email.entity.EmailAttachment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Slf4j
@Component
public class EmailMapper {
    
    public EmailDto toDto(Email email) {
        if (email == null) {
            return null;
        }
        
        return EmailDto.builder()
                .id(email.getId())
                .from(email.getFrom())
                .fromName(email.getFromName())
                .to(email.getTo())
                .cc(email.getCc())
                .bcc(email.getBcc())
                .subject(email.getSubject())
                .body(email.getBody())
                .htmlBody(email.getHtmlBody())
                .isRead(email.getIsRead())
                .isStarred(email.getIsStarred())
                .folder(email.getFolder().name().toLowerCase())
                .labels(email.getLabels())
                .attachments(email.getAttachments() != null ? 
                        email.getAttachments().stream()
                                .map(this::toAttachmentDto)
                                .collect(Collectors.toList()) : null)
                .sentAt(email.getSentAt())
                .createdAt(email.getCreatedAt())
                .updatedAt(email.getUpdatedAt())
                .build();
    }
    
    public EmailAttachmentDto toAttachmentDto(EmailAttachment attachment) {
        if (attachment == null) {
            return null;
        }
        
        return EmailAttachmentDto.builder()
                .id(attachment.getId())
                .filename(attachment.getFilename())
                .size(attachment.getSize())
                .mimeType(attachment.getMimeType())
                .url(attachment.getUrl())
                .build();
    }
}
