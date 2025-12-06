package com.syncora.communication.chat.entity;

import com.syncora.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "chat_rooms", indexes = {
        @Index(name = "idx_chatroom_roomid", columnList = "room_id"),
        @Index(name = "idx_chatroom_owner", columnList = "owner_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRoom {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "room_id", length = 36)
    private String id;

    @Column(name = "name", length = 100)
    private String name; // optional for group

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @ElementCollection
    @CollectionTable(name = "chat_room_members",
            joinColumns = @JoinColumn(name = "room_id")
    )
    @Column(name = "member_email")
    private List<String> memberEmails; // simple membership tracking by email

    @Column(nullable = false)
    @Builder.Default
    private boolean isGroup = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean isDeleted = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean isPrivate = false;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
