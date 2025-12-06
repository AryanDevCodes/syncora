package com.syncora.email.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "email_attachments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailAttachment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "email_id", nullable = false)
    private Email email;
    
    @Column(nullable = false)
    private String filename;
    
    @Column(nullable = false)
    private Long size;
    
    @Column(name = "mime_type")
    private String mimeType;
    
    @Column(nullable = false)
    private String url;
}
