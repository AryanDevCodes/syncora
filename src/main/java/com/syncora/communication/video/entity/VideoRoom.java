package com.syncora.communication.video.entity;

import com.syncora.communication.chat.entity.ChatRoom;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "video_rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VideoRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "chat_room_id", nullable = false)
    private ChatRoom chatRoom;

    @Column(name = "room_name", nullable = false)
    private String roomName;

    @Column(name = "sfu_room_id", length = 255)
    private String sfuRoomId;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "ended_by",length = 100)
    private String endedBy;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "video_room_participants", joinColumns = @JoinColumn(name = "video_room_id"))
    @Column(name = "participant_email")
    @Builder.Default
    private List<String> participants = new ArrayList<>();

    @Column(name = "recording_enabled")
    @Builder.Default
    private boolean recordingEnabled = false;
}
