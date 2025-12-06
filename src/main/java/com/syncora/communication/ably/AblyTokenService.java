package com.syncora.communication.ably;

import io.ably.lib.rest.AblyRest;
import io.ably.lib.rest.Auth;
import io.ably.lib.rest.Channel;
import io.ably.lib.types.AblyException;
import io.ably.lib.types.Message;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class AblyTokenService {

    private final AblyRest ablyRest;
    private final ObjectMapper objectMapper;

    public AblyTokenService(@Value("${ably.api.key}") String ablyApiKey) {
        try {
            this.ablyRest = new AblyRest(ablyApiKey);
            this.objectMapper = new ObjectMapper();
            log.info("✅ Ably REST client initialized successfully");
        } catch (AblyException e) {
            throw new RuntimeException("Failed to initialize Ably client", e);
        }
    }

    /**
     * Generates a direct Ably token for a user.
     * Less secure than TokenRequest as it requires server round-trip each time.
     */
    public String generateToken(String clientId) throws AblyException {
        Auth.TokenParams tokenParams = new Auth.TokenParams();
        tokenParams.clientId = clientId;
        tokenParams.capability = "{\"*\":[\"*\"]}";
        tokenParams.ttl = 3600000L; // 1 hour

        return ablyRest.auth.requestToken(tokenParams, null).token;
    }

    /**
     * Publishes a chat message to an Ably channel for real-time delivery.
     * Follows Ably best practices:
     * - Uses channel-specific naming (chat-{roomId})
     * - Publishes with event name "message"
     * - Includes all required fields for frontend compatibility
     * - Non-blocking (doesn't throw on error since message is already in DB)
     */
    public void publishMessage(String roomId, String messageId, String content, 
                               String senderEmail, long timestamp, String status, String type) {
        try {
            String channelName = "chat-" + roomId;
            Channel channel = ablyRest.channels.get(channelName);
            
            // Build message payload matching frontend ChatMessage interface
            Map<String, Object> messageData = new HashMap<>();
            messageData.put("id", messageId);
            messageData.put("content", content);
            messageData.put("senderEmail", senderEmail);
            messageData.put("timestamp", timestamp);
            messageData.put("status", status);
            messageData.put("type", type.toLowerCase()); // TEXT, IMAGE, FILE, etc.
            
            // Convert Map to JSON string for Ably
            String jsonData = objectMapper.writeValueAsString(messageData);
            
            // Create Ably Message object and publish
            Message ablyMessage = new Message("message", jsonData);
            channel.publish(new Message[] { ablyMessage });
            
            log.info("📨 Published message to Ably channel: {}, messageId: {}, type: {}", 
                    channelName, messageId, type);
        } catch (AblyException e) {
            log.error("❌ Failed to publish message to Ably channel for room: {}", roomId, e);
            // Don't throw exception - message is already saved to DB
            // Client will still get message on next refresh
        } catch (Exception e) {
            log.error("❌ Failed to serialize message data for room: {}", roomId, e);
        }
    }
}