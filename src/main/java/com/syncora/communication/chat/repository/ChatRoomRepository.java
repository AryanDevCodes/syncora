package com.syncora.communication.chat.repository;

import com.syncora.communication.chat.entity.ChatRoom;
import com.syncora.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, String> {

        List<ChatRoom> findAllByOwner(User owner);

        List<ChatRoom> findAllByOwnerId(String ownerId);

        @Query("SELECT r.id FROM ChatRoom r WHERE :email MEMBER OF r.memberEmails")
        List<String> findIdsByMemberEmail(@Param("email") String email);

        @Modifying
        @Transactional
        void deleteAllByOwner(User owner);

        @Modifying
        @Transactional
        void deleteAllByOwnerId(String ownerId);

        @Modifying
        @Transactional
        @Query(value = "DELETE FROM chat_room_members WHERE member_email = :email", nativeQuery = true)
        void deleteAllMembershipsByEmail(@Param("email") String email);

        Optional<ChatRoom> findByIdAndMemberEmailsContaining(String id, String memberEmail);

        @Query("SELECT r FROM ChatRoom r " +
                        "WHERE r.isGroup = false " +
                        "AND :user1Email MEMBER OF r.memberEmails " +
                        "AND :user2Email MEMBER OF r.memberEmails")
        Optional<ChatRoom> findDirectRoomBetween(@Param("user1Email") String user1Email,
                        @Param("user2Email") String user2Email);

        @Query("SELECT r FROM ChatRoom r WHERE :email MEMBER OF r.memberEmails AND r.isDeleted = false")
        List<ChatRoom> findVisibleRoomsForUser(@Param("email") String email);

        List<ChatRoom> findByOwner_EmailAndIsGroupTrue(String email);

        @Query("SELECT r FROM ChatRoom r WHERE r.isGroup = true " +
                        "AND LOWER(r.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
                        "AND :email MEMBER OF r.memberEmails")
        List<ChatRoom> searchGroupChats(@Param("email") String email, @Param("query") String query);

        @Query("SELECT COUNT(r) FROM ChatRoom r WHERE r.isGroup = true AND :email MEMBER OF r.memberEmails")
        long countGroupMemberships(@Param("email") String email);

        @Query("SELECT c FROM ChatRoom c WHERE c.isGroup = true AND :email IN elements(c.memberEmails)")
        List<ChatRoom> findGroupRoomsForUser(@Param("email") String email);

        @Query("SELECT c FROM ChatRoom c WHERE c.isGroup = false AND :email IN elements(c.memberEmails)")
        List<ChatRoom> findDirectRoomsForUser(@Param("email") String email);

        @Modifying
        @Query(value = "DELETE FROM chat_room_members WHERE room_id = :roomId", nativeQuery = true)
        void deleteAllMembersByRoomId(@Param("roomId") String roomId);

}
