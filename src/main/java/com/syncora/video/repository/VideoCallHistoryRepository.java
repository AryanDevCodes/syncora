package com.syncora.video.repository;

import com.syncora.video.entity.VideoCallHistory;
import com.syncora.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VideoCallHistoryRepository extends JpaRepository<VideoCallHistory, String> {
    
    @Modifying
    @Transactional
    void deleteAllByUser(User user);
    
    List<VideoCallHistory> findByUserOrderByStartTimeDesc(User user);
    
    List<VideoCallHistory> findByUserAndStartTimeBetweenOrderByStartTimeDesc(
            User user, 
            LocalDateTime startDate, 
            LocalDateTime endDate
    );
    
    @Query("SELECT SUM(v.durationSeconds) FROM VideoCallHistory v WHERE v.user = :user " +
           "AND v.startTime >= :startDate")
    Long getTotalDurationSecondsForUser(User user, LocalDateTime startDate);
    
    @Query("SELECT COUNT(v) FROM VideoCallHistory v WHERE v.user = :user " +
           "AND v.wasLimitReached = true")
    Long getTimeLimitReachedCount(User user);
}
