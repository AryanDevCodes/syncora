package com.syncora.communication.ably;

import io.ably.lib.realtime.AblyRealtime;
import io.ably.lib.realtime.Channel;
import io.ably.lib.rest.Auth.TokenParams;
import io.ably.lib.types.AblyException;
import io.ably.lib.types.Capability;
import io.ably.lib.types.ClientOptions;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for handling Ably voice call functionality
 * NOTE: This is deprecated in favor of ZegoCloud for video/voice calls
 * Kept for backward compatibility
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Deprecated
public class AblyVoiceCallService {

    @Value("${ably.api.key}")
    private String ablyApiKey;

    /**
     * Generate a token specifically for voice call channels
     * 
     * @param clientId The user's client ID (email)
     * @param channelName The voice call channel name
     * @return Map containing token and channel information
     * @throws AblyException if token generation fails
     */
    public Map<String, Object> generateVoiceCallToken(String clientId, String channelName) throws AblyException {
        log.info("Generating voice call token for client: {} on channel: {}", clientId, channelName);
        
        try {
            ClientOptions options = new ClientOptions();
            options.key = ablyApiKey;
            
            TokenParams tokenParams = new TokenParams();
            tokenParams.clientId = clientId;
            tokenParams.ttl = 3600000; // 1 hour in milliseconds
            
            // Grant specific capabilities for voice channels
            Capability capability = new Capability();
            capability.addResource(channelName, "publish", "subscribe", "presence");
            tokenParams.capability = capability.toString();
            
            AblyRealtime ably = new AblyRealtime(options);
            String token = ably.auth.requestToken(tokenParams, null).token;
            ably.close();
            
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("clientId", clientId);
            response.put("channelName", channelName);
            response.put("ttl", 3600);
            
            log.info("Voice call token generated successfully for client: {}", clientId);
            return response;
            
        } catch (AblyException e) {
            log.error("Failed to generate voice call token for client: {}", clientId, e);
            throw e;
        }
    }

    /**
     * Create a new voice call room
     * 
     * @param roomId The unique room identifier
     * @param userId The user creating the room
     * @return Map containing room information
     * @throws AblyException if room creation fails
     */
    public Map<String, Object> createVoiceCallRoom(String roomId, String userId) throws AblyException {
        log.info("Creating voice call room: {} for user: {}", roomId, userId);
        
        String channelName = "voice-call-" + roomId;
        
        try {
            ClientOptions options = new ClientOptions();
            options.key = ablyApiKey;
            options.clientId = userId;
            
            AblyRealtime ably = new AblyRealtime(options);
            Channel channel = ably.channels.get(channelName);
            
            // Enter presence to mark room as active
            channel.presence.enter("creator", null);
            
            Map<String, Object> response = new HashMap<>();
            response.put("roomId", roomId);
            response.put("channelName", channelName);
            response.put("creatorId", userId);
            response.put("status", "active");
            
            log.info("Voice call room created successfully: {}", roomId);
            ably.close();
            return response;
            
        } catch (AblyException e) {
            log.error("Failed to create voice call room: {}", roomId, e);
            throw e;
        }
    }

    /**
     * Join an existing voice call room
     * 
     * @param roomId The room identifier to join
     * @param userId The user joining the room
     * @return Map containing join information
     * @throws AblyException if joining fails
     */
    public Map<String, Object> joinVoiceCallRoom(String roomId, String userId) throws AblyException {
        log.info("User {} joining voice call room: {}", userId, roomId);
        
        String channelName = "voice-call-" + roomId;
        
        try {
            ClientOptions options = new ClientOptions();
            options.key = ablyApiKey;
            options.clientId = userId;
            
            AblyRealtime ably = new AblyRealtime(options);
            Channel channel = ably.channels.get(channelName);
            
            // Enter presence to indicate user has joined
            channel.presence.enter("participant", null);
            
            // Get current participants
            int participantCount = channel.presence.get().length;
            
            Map<String, Object> response = new HashMap<>();
            response.put("roomId", roomId);
            response.put("channelName", channelName);
            response.put("userId", userId);
            response.put("participantCount", participantCount);
            response.put("status", "joined");
            
            log.info("User {} successfully joined voice call room: {}", userId, roomId);
            ably.close();
            return response;
            
        } catch (AblyException e) {
            log.error("Failed to join voice call room: {} for user: {}", roomId, userId, e);
            throw e;
        }
    }

    /**
     * Leave a voice call room
     * 
     * @param roomId The room identifier to leave
     * @param userId The user leaving the room
     * @throws AblyException if leaving fails
     */
    public void leaveVoiceCallRoom(String roomId, String userId) throws AblyException {
        log.info("User {} leaving voice call room: {}", userId, roomId);
        
        String channelName = "voice-call-" + roomId;
        
        try {
            ClientOptions options = new ClientOptions();
            options.key = ablyApiKey;
            options.clientId = userId;
            
            AblyRealtime ably = new AblyRealtime(options);
            Channel channel = ably.channels.get(channelName);
            
            // Leave presence
            channel.presence.leave(null);
            ably.close();
            
            log.info("User {} successfully left voice call room: {}", userId, roomId);
            
        } catch (AblyException e) {
            log.error("Failed to leave voice call room: {} for user: {}", roomId, userId, e);
            throw e;
        }
    }
}
