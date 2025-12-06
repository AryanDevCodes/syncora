package com.syncora.video.controller;

import com.syncora.video.dto.SaveCallHistoryRequest;
import com.syncora.video.dto.VideoCallHistoryDTO;
import com.syncora.video.service.VideoCallHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/video/history")
@RequiredArgsConstructor
public class VideoCallHistoryController {
    
    private final VideoCallHistoryService historyService;
    
    @PostMapping
    public ResponseEntity<VideoCallHistoryDTO> saveCallHistory(
            @RequestBody SaveCallHistoryRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        VideoCallHistoryDTO history = historyService.saveCallHistory(userId, request);
        return ResponseEntity.ok(history);
    }
    
    @GetMapping
    public ResponseEntity<List<VideoCallHistoryDTO>> getCallHistory(Authentication authentication) {
        String userId = authentication.getName();
        List<VideoCallHistoryDTO> history = historyService.getUserCallHistory(userId);
        return ResponseEntity.ok(history);
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getCallStats(Authentication authentication) {
        String userId = authentication.getName();
        Long totalSeconds = historyService.getTotalCallTimeThisWeek(userId);
        
        return ResponseEntity.ok(Map.of(
                "totalSecondsThisWeek", totalSeconds,
                "totalMinutesThisWeek", totalSeconds / 60,
                "totalHoursThisWeek", String.format("%.1f", totalSeconds / 3600.0)
        ));
    }
}
