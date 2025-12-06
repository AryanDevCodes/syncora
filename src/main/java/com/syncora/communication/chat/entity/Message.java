package com.syncora.communication.chat.entity;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages", indexes = {
        @Index(name = "idx_message_room_ts", columnList = "room_id, sent_at"),
        @Index(name = "idx_message_messageid", columnList = "client_message_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "message_id")
    private String id;

    @Column(name = "client_message_id", length = 36)
    private String clientMessageId;

    @Column(name = "room_id", nullable = false)
    private String roomId;

    @Column(name = "sender_email", nullable = false)
    private String senderEmail;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column
    private String attachmentUrl;

    @Column
    @Builder.Default
    private LocalDateTime sentAt = LocalDateTime.now();

    @Column
    @Builder.Default
    private boolean delivered = false;

    @Column
    @Schema(description = "Timestamp when message was delivered", nullable = true)
    private LocalDateTime deliveredAt;

    @Column
    @Builder.Default
    private boolean read = false;

    @Column
    @Schema(description = "Timestamp when message was read", nullable = true)
    private LocalDateTime readAt;

    @Column(nullable = false)
    @Builder.Default
    private boolean deleted = false;

    @Column
    private LocalDateTime deletedAt;


    @Column(length = 50)
    @Builder.Default
    private String type = "TEXT"; // TEXT, IMAGE, FILE, SYSTEM, etc.

    // File attachment fields
    @Column(name = "file_id")
    private String fileId;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "file_type", length = 100)
    private String fileType;
}
