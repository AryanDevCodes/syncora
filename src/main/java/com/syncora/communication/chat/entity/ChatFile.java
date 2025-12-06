package com.syncora.communication.chat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_files")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatFile {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(name = "message_id")
    private String messageId;
    
    @Column(name = "file_name", nullable = false)
    private String fileName;
    
    @Column(name = "file_size", nullable = false)
    private Long fileSize; // Size in bytes
    
    @Column(name = "file_type", nullable = false)
    private String fileType; // MIME type
    
    @Column(name = "uploaded_by", nullable = false)
    private String uploadedBy; // User email
    
    @CreationTimestamp
    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt;
    
    @Column(name = "file_data", columnDefinition = "BYTEA", nullable = false)
    private byte[] fileData; // Store file content as binary
}
