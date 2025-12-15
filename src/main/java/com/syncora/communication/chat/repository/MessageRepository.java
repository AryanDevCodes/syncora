package com.syncora.communication.chat.repository;

import com.syncora.communication.chat.entity.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, String> {
    
    @Modifying
    @Transactional
    void deleteAllBySenderEmail(String senderEmail);

    @Modifying
    @Transactional
    void deleteAllByRoomIdIn(Collection<String> roomIds);

        // 🔹 1. Get all messages in a room (including deleted, if needed)
        List<Message> findByRoomIdOrderBySentAtAsc(String roomId);

        // 🔹 2. Get only active (non-deleted) messages
        @Query("""
                        SELECT m FROM Message m
                        WHERE m.roomId = :roomId
                          AND m.deleted = false
                        ORDER BY m.sentAt ASC
                        """)
        List<Message> findActiveMessages(@Param("roomId") String roomId);

        // 🔹 3. Get last message (for preview in room list)
        Optional<Message> findTopByRoomIdOrderBySentAtDesc(String roomId);

        // 🔹 4. Count unread messages for a user in a room
        @Query("""
                        SELECT COUNT(m)
                        FROM Message m
                        WHERE m.roomId = :roomId
                          AND m.read = false
                          AND m.senderEmail <> :email
                        """)
        long countUnread(@Param("roomId") String roomId, @Param("email") String email);

        // 🔹 5. Search messages by content (supports emojis)
        @Query("""
                        SELECT m FROM Message m
                        WHERE m.roomId = :roomId
                          AND m.deleted = false
                          AND LOWER(m.content) LIKE LOWER(CONCAT('%', :query, '%'))
                        ORDER BY m.sentAt ASC
                        """)
        List<Message> searchMessages(@Param("roomId") String roomId, @Param("query") String query);

        // 🔹 6. Get all attachments in a room
        @Query("""
                        SELECT m.attachmentUrl
                        FROM Message m
                        WHERE m.roomId = :roomId
                          AND m.attachmentUrl IS NOT NULL
                          AND m.deleted = false
                        """)
        List<String> getAllAttachments(@Param("roomId") String roomId);

        // 🔹 7. Bulk mark messages as read
        @Modifying
        @Query("""
                        UPDATE Message m
                        SET m.read = true,
                            m.readAt = CURRENT_TIMESTAMP
                        WHERE m.roomId = :roomId
                          AND m.senderEmail <> :email
                          AND m.read = false
                        """)
        int markAllRead(@Param("roomId") String roomId, @Param("email") String email);

        // 🔹 8. Bulk mark messages as delivered
        @Modifying
        @Query("""
                        UPDATE Message m
                        SET m.delivered = true,
                            m.deliveredAt = CURRENT_TIMESTAMP
                        WHERE m.roomId = :roomId
                          AND m.senderEmail <> :email
                          AND m.delivered = false
                        """)
        int markAllDelivered(@Param("roomId") String roomId, @Param("email") String email);

        // 🔹 9. Find unread messages (for selective marking)
        @Query("""
                        SELECT m
                        FROM Message m
                        WHERE m.roomId = :roomId
                          AND m.read = false
                          AND m.senderEmail <> :email
                        """)
        List<Message> findUnreadByRoomAndUser(@Param("roomId") String roomId, @Param("email") String email);

        // 🔹 10. Pagination support
        @Query("""
                        SELECT m FROM Message m
                        WHERE m.roomId = :roomId
                          AND m.deleted = false
                        ORDER BY m.sentAt ASC
                        """)
        List<Message> findMessagesPaged(@Param("roomId") String roomId, Pageable pageable);

        // 🔹 11. Count unread messages grouped by room
        @Query("""
                        SELECT m.roomId, COUNT(m)
                        FROM Message m
                        WHERE m.read = false
                          AND m.senderEmail <> :email
                        GROUP BY m.roomId
                        """)
        List<Object[]> countUnreadByUser(@Param("email") String email);

        // 🔹 12. Soft delete for sender only
        @Modifying
        @Query("""
                        UPDATE Message m
                        SET m.deleted = true,
                            m.deletedAt = CURRENT_TIMESTAMP
                        WHERE m.id = :messageId
                          AND m.senderEmail = :email
                        """)
        int deleteForSender(@Param("messageId") String messageId, @Param("email") String email);

        // 🔹 13. Soft delete for all (owner or sender)
        @Modifying
        @Query("""
                        UPDATE Message m
                        SET m.deleted = true,
                            m.deletedAt = CURRENT_TIMESTAMP
                        WHERE m.id = :messageId
                        """)
        int deleteForAll(@Param("messageId") String messageId);

        @Modifying
        @Query("DELETE FROM Message m WHERE m.roomId = :roomId")
        void deleteAllByRoomId(@Param("roomId") String roomId);

}
