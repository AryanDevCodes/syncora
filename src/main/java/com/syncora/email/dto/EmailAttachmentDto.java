package com.syncora.email.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailAttachmentDto {
    private String id;
    private String filename;
    private Long size;
    private String mimeType;
    private String url;
}
