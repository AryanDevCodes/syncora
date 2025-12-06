package com.syncora.communication.chat.repository;

import com.syncora.communication.chat.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, String> {

        // ✅ Find specific room by ID if the user is a participant
        Optional<ChatRoom> findByIdAndMemberEmailsContaining(String id, String memberEmail);

        // ✅ Check if a 1-on-1 room already exists
        @Query("SELECT r FROM ChatRoom r " +
                        "WHERE r.isGroup = false " +
                        "AND :user1Email MEMBER OF r.memberEmails " +
                        "AND :user2Email MEMBER OF r.memberEmails")
        Optional<ChatRoom> findDirectRoomBetween(@Param("user1Email") String user1Email,
                        @Param("user2Email") String user2Email);

        // ✅ List only visible (non-deleted) rooms for a user
        @Query("SELECT r FROM ChatRoom r WHERE :email MEMBER OF r.memberEmails AND r.isDeleted = false")
        List<ChatRoom> findVisibleRoomsForUser(@Param("email") String email);

        // ⚙️ Optional: Fetch all group chats owned by a user (for "My Groups" section)
        List<ChatRoom> findByOwner_EmailAndIsGroupTrue(String email);

        // ⚙️ Optional: Search group chats by name
        @Query("SELECT r FROM ChatRoom r WHERE r.isGroup = true " +
                        "AND LOWER(r.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
                        "AND :email MEMBER OF r.memberEmails")
        List<ChatRoom> searchGroupChats(@Param("email") String email, @Param("query") String query);

        // ⚙️ Optional: Count group memberships (analytics or subscription limits)
        @Query("SELECT COUNT(r) FROM ChatRoom r WHERE r.isGroup = true AND :email MEMBER OF r.memberEmails")
        long countGroupMemberships(@Param("email") String email);

        @Query("SELECT c FROM ChatRoom c WHERE c.isGroup = true AND :email IN elements(c.memberEmails)")
        List<ChatRoom> findGroupRoomsForUser(@Param("email") String email);

        @Query("SELECT c FROM ChatRoom c WHERE c.isGroup = false AND :email IN elements(c.memberEmails)")
        List<ChatRoom> findDirectRoomsForUser(@Param("email") String email);

       /* 
        @Modifying
        @Query("DELETE FROM ChatRoomMember m WHERE m.roomId = :roomId")
        void deleteAllByRoomId(@Param("roomId") String roomId);
       */ 

        @Modifying
        @Query(value = "DELETE FROM chat_room_members WHERE room_id = :roomId", nativeQuery = true)
        void deleteAllMembersByRoomId(@Param("roomId") String roomId);

}
