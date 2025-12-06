package com.syncora.communication.chat.service;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.syncora.communication.ably.AblyTokenService;

import java.util.*;

/**
 * Service for managing chat users via REST API (migrated to Ably)
 * Handles user registration, token generation, and user management
 */
@Service
@Slf4j
@RequiredArgsConstructor
@Deprecated
public class ChatUserService {

    private final AblyTokenService ablyTokenService;


    /**
     * @deprecated Legacy method - Ably doesn't require app tokens
     */
    @Deprecated
    public String getAppToken() {
        log.debug("App token not required with Ably");
        return "not-required";
    }

    /**
     * @deprecated Legacy method - Ably handles user registration automatically
     */
    @Deprecated
    public Map<String, Object> registerUser(String username, String password) {
        log.debug("User registration not required with Ably - users are handled automatically");
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Ably users are automatically managed");
        return response;
    }

    /**
     * @deprecated Legacy method - Ably handles user management automatically
     */
    @Deprecated
    public boolean userExists(String username) {
        // With Ably, users don't need pre-registration
        log.debug("User existence check not required with Ably");
        return true;
    }
    
    /**
     * @deprecated Legacy method - not needed with Ably
     */
    @Deprecated
    public Map<String, Object> registerBatchUsers(List<Map<String, String>> users) {
        log.debug("Batch user registration not required with Ably");
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Ably users are automatically managed");
        response.put("count", users != null ? users.size() : 0);
        return response;
    }

    /**
     * Get user token for client authentication (migrated to Ably)
     * @param username Username to generate token for
     * @param tokenExpiry Token expiration time in seconds (default: 3600)
     * @return User token response
     */
    public Map<String, Object> getUserToken(String username, Integer tokenExpiry) {
        int ttl = (tokenExpiry != null && tokenExpiry > 0) ? tokenExpiry : 3600;
        try {
            String ablyToken = ablyTokenService.generateToken(username);
            Map<String, Object> response = new HashMap<>();
            response.put("access_token", ablyToken);
            response.put("expires_in", ttl);
            return response;
        } catch (Exception e) {
            log.warn("⚠️ Failed to get Ably token for {}: {}", username, e.getMessage());
            return null;
        }
    }

    /**
     * @deprecated Legacy method - not needed with Ably
     */
    @Deprecated
    public Map<String, Object> getUserInfo(String username) {
        log.debug("User info not required with Ably");
        Map<String, Object> response = new HashMap<>();
        response.put("username", username);
        response.put("status", "active");
        return response;
    }

    /**
     * @deprecated Legacy method - not needed with Ably
     */
    @Deprecated
    public Map<String, Object> deleteUser(String username) {
        log.debug("User deletion not required with Ably");
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("username", username);
        return response;
    }

    /**
     * @deprecated Legacy method - not needed with Ably
     */
    @Deprecated
    public Map<String, Object> updateUserPassword(String username, String newPassword) {
        log.debug("Password update not required with Ably");
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        return response;
    }

    /**
     * @deprecated Legacy method - not needed with Ably
     */
    @Deprecated
    public Map<String, Object> getAllUsers(Integer limit, String cursor) {
        log.debug("User list not required with Ably");
        Map<String, Object> response = new HashMap<>();
        response.put("users", new ArrayList<>());
        response.put("count", 0);
        return response;
    }

    /**
     * @deprecated Legacy method - not needed with Ably
     */
    @Deprecated
    public Map<String, Object> getUserOnlineStatus(String username) {
        log.debug("User online status managed by Ably presence");
        Map<String, Object> response = new HashMap<>();
        response.put("username", username);
        response.put("status", "online");
        return response;
    }

    /**
     * Regenerate user token with custom expiry
     * @param username Username
     * @param expirySeconds Token expiry in seconds
     * @return New token response
     */
    public Map<String, Object> regenerateUserToken(String username, Integer expirySeconds) {
        return getUserToken(username, expirySeconds != null ? expirySeconds : 3600);
    }
}
