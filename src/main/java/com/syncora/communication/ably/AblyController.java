package com.syncora.communication.ably;

import com.syncora.security.JwtProvider;
import io.ably.lib.types.AblyException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/ably")
@RequiredArgsConstructor
@SuppressWarnings("deprecation")
public class AblyController {

    private final AblyTokenService ablyTokenService;
    private final AblyVoiceCallService ablyVoiceCallService;
    private final JwtProvider jwtProvider;

    private String extractEmail(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            throw new RuntimeException("Missing Authorization header");
        }
        String token = header.substring(7);
        return jwtProvider.extractEmail(token);
    }

    /**
     * Generate Ably token for chat
     * Endpoint: POST /api/ably/tokens/chat
     */
    @PostMapping("/tokens/chat")
    public ResponseEntity<Map<String, Object>> generateChatToken(
            HttpServletRequest request) {
        try {
            String clientId = extractEmail(request);
            String token = ablyTokenService.generateToken(clientId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("clientId", clientId);
            response.put("success", true);
            
            log.info("Generated chat token for user: {}", clientId);
            return ResponseEntity.ok(response);
            
        } catch (AblyException e) {
            log.error("Failed to generate chat token", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to generate token: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Generate Ably token for voice call (Deprecated - use ZegoCloud)
     * Endpoint: POST /api/ably/tokens/voice
     */
    @Deprecated
    @PostMapping("/tokens/voice")
    public ResponseEntity<Map<String, Object>> generateVoiceToken(
            HttpServletRequest request,
            @RequestBody Map<String, String> requestBody) {
        try {
            String clientId = extractEmail(request);
            String channelName = requestBody.getOrDefault("channelName", "voice-call-default");
            
            Map<String, Object> response = ablyVoiceCallService.generateVoiceCallToken(clientId, channelName);
            response.put("success", true);
            
            log.info("Generated voice token for user: {} on channel: {}", clientId, channelName);
            return ResponseEntity.ok(response);
            
        } catch (AblyException e) {
            log.error("Failed to generate voice token", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to generate voice token: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Create a new voice call room (Deprecated - use ZegoCloud)
     * Endpoint: POST /api/ably/voice/rooms
     */
    @Deprecated
    @PostMapping("/voice/rooms")
    public ResponseEntity<Map<String, Object>> createVoiceRoom(
            HttpServletRequest request,
            @RequestBody Map<String, String> requestBody) {
        try {
            String userId = extractEmail(request);
            String roomId = requestBody.getOrDefault("roomId", 
                java.util.UUID.randomUUID().toString());
            
            Map<String, Object> response = ablyVoiceCallService.createVoiceCallRoom(roomId, userId);
            response.put("success", true);
            
            return ResponseEntity.ok(response);
            
        } catch (AblyException e) {
            log.error("Failed to create voice room", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to create room: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Join an existing voice call room (Deprecated - use ZegoCloud)
     * Endpoint: POST /api/ably/voice/rooms/{roomId}/join
     */
    @Deprecated
    @PostMapping("/voice/rooms/{roomId}/join")
    public ResponseEntity<Map<String, Object>> joinVoiceRoom(
            @PathVariable String roomId,
            HttpServletRequest request) {
        try {
            String userId = extractEmail(request);
            
            Map<String, Object> response = ablyVoiceCallService.joinVoiceCallRoom(roomId, userId);
            response.put("success", true);
            
            return ResponseEntity.ok(response);
            
        } catch (AblyException e) {
            log.error("Failed to join voice room", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to join room: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Test Ably configuration
     * Endpoint: GET /api/ably/test
     */
    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> testAblyConfiguration(
            HttpServletRequest request) {
        try {
            String clientId = extractEmail(request);
            
            // Try to generate a test token
            String token = ablyTokenService.generateToken(clientId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Ably configuration is working correctly");
            response.put("hasToken", token != null && !token.isEmpty());
            response.put("clientId", clientId);
            
            log.info("Ably configuration test successful");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Ably configuration test failed", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Configuration test failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
