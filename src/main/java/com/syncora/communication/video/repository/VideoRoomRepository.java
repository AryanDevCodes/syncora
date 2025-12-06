package com.syncora.communication.video.repository;

import com.syncora.communication.video.entity.VideoRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VideoRoomRepository extends JpaRepository<VideoRoom, String> {

    // ✅ Get all video rooms for a chat (including ended)
    List<VideoRoom> findByChatRoom_Id(String chatRoomId);

    // ✅ Get active video room for a chat (only one at a time)
    @Query("SELECT v FROM VideoRoom v WHERE v.chatRoom.id = :chatRoomId AND v.endedAt IS NULL")
    Optional<VideoRoom> findActiveByChatRoomId(String chatRoomId);

    // ✅ Get active video room by its ID
    @Query("SELECT v FROM VideoRoom v WHERE v.id = :id AND v.endedAt IS NULL")
    Optional<VideoRoom> findActiveById(String id);

    @Query("SELECT v FROM VideoRoom v WHERE v.chatRoom.id = :chatRoomId AND v.endedAt IS NOT NULL")
    List<VideoRoom> findEndedByChatRoomId(String chatRoomId);

    @Query("SELECT COUNT(v) FROM VideoRoom v WHERE v.endedAt IS NULL")
    long countActiveSessions();

    @Query(value = "SELECT AVG(EXTRACT(EPOCH FROM (v.endedAt - v.startedAt))) FROM VideoRoom v WHERE v.endedAt IS NOT NULL", nativeQuery = true)
    Double averageSessionDuration();

    Optional<VideoRoom> findByChatRoom_IdAndEndedAtIsNull(String chatRoomId);
}
