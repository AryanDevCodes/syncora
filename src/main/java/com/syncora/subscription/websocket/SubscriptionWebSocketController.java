package com.syncora.subscription.websocket;

import com.syncora.subscription.dto.SubscriptionDTO;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class SubscriptionWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Send subscription update to specific user
     */
    public void sendSubscriptionUpdate(Long userId, SubscriptionDTO subscription) {
        messagingTemplate.convertAndSend(
            "/queue/subscription/" + userId, 
            subscription
        );
    }

    /**
     * Broadcast subscription event to all users (e.g., maintenance notification)
     */
    public void broadcastSubscriptionEvent(String eventType, Object data) {
        messagingTemplate.convertAndSend(
            "/topic/subscription/events",
            new SubscriptionEvent(eventType, data)
        );
    }

    @MessageMapping("/subscription/subscribe")
    @SendTo("/queue/subscription/updates")
    public String handleSubscription(String message) {
        return "Subscribed to subscription updates";
    }

    public record SubscriptionEvent(String eventType, Object data) {}
}
