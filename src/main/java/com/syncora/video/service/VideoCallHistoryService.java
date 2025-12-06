package com.syncora.video.service;

import com.syncora.video.dto.SaveCallHistoryRequest;
import com.syncora.video.dto.VideoCallHistoryDTO;
import com.syncora.video.entity.VideoCallHistory;
import com.syncora.video.repository.VideoCallHistoryRepository;
import com.syncora.user.entity.User;
import com.syncora.user.repository.UserRepository;
import com.syncora.subscription.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VideoCallHistoryService {
    
    private final VideoCallHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    
    @Transactional
    public VideoCallHistoryDTO saveCallHistory(String userEmail, SaveCallHistoryRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Get current subscription to record plan
        var subscription = subscriptionRepository.findActiveSubscriptionByUserId(user.getId()).orElse(null);
        String planName = subscription != null ? subscription.getPlan().getName() : "STARTER";
        Integer timeLimit = subscription != null ? subscription.getPlan().getVideoCallDurationMinutes() : 40;
        
        LocalDateTime startTime = LocalDateTime.parse(request.getStartTime(), DateTimeFormatter.ISO_DATE_TIME);
        LocalDateTime endTime = LocalDateTime.parse(request.getEndTime(), DateTimeFormatter.ISO_DATE_TIME);
        
        VideoCallHistory history = VideoCallHistory.builder()
                .user(user)
                .roomId(request.getRoomId())
                .startTime(startTime)
                .endTime(endTime)
                .durationSeconds(request.getDurationSeconds())
                .planAtCallTime(planName)
                .timeLimitSeconds(timeLimit != -1 ? timeLimit * 60 : null)
                .wasLimitReached(request.getWasLimitReached() != null ? request.getWasLimitReached() : false)
                .build();
        
        history = historyRepository.save(history);
        
        log.info("Saved video call history for user {}: {} seconds in room {}", 
                user.getId(), request.getDurationSeconds(), request.getRoomId());
        
        return toDTO(history);
    }
    
    public List<VideoCallHistoryDTO> getUserCallHistory(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return historyRepository.findByUserOrderByStartTimeDesc(user)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    public Long getTotalCallTimeThisWeek(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Calculate start of current week (Monday at 00:00:00)
        // DayOfWeek: MONDAY=1, TUESDAY=2, ..., SUNDAY=7
        LocalDateTime now = LocalDateTime.now();
        int dayOfWeek = now.getDayOfWeek().getValue(); // 1=Mon, 7=Sun
        LocalDateTime startOfWeek = now.minusDays(dayOfWeek - 1)
                .withHour(0).withMinute(0).withSecond(0).withNano(0);
        
        Long total = historyRepository.getTotalDurationSecondsForUser(user, startOfWeek);
        return total != null ? total : 0L;
    }
    
    private VideoCallHistoryDTO toDTO(VideoCallHistory history) {
        return VideoCallHistoryDTO.builder()
                .id(history.getId())
                .userId(history.getUser().getId())
                .roomId(history.getRoomId())
                .startTime(history.getStartTime())
                .endTime(history.getEndTime())
                .durationSeconds(history.getDurationSeconds())
                .planAtCallTime(history.getPlanAtCallTime())
                .timeLimitSeconds(history.getTimeLimitSeconds())
                .wasLimitReached(history.getWasLimitReached())
                .createdAt(history.getCreatedAt())
                .build();
    }
}
