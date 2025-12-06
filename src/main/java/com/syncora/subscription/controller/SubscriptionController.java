package com.syncora.subscription.controller;

import com.syncora.subscription.dto.*;
import com.syncora.subscription.service.SubscriptionService;
import com.syncora.security.JwtProvider;
import com.syncora.user.entity.User;
import com.syncora.user.repository.UserRepository;
import com.syncora.common.exception.ResourceNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SubscriptionController {
    
    private final SubscriptionService subscriptionService;
    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;
    
    private User getCurrentUser(HttpServletRequest req) {
        String token = req.getHeader("Authorization");
        if (token == null || !token.startsWith("Bearer ")) {
            throw new ResourceNotFoundException("Authorization token not found");
        }
        token = token.substring(7);
        String email = jwtProvider.extractEmail(token);
        if (email == null) {
            throw new ResourceNotFoundException("Invalid or expired token");
        }
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
    
    @GetMapping("/plans")
    public ResponseEntity<List<PricingPlanDTO>> getAllPlans() {
        return ResponseEntity.ok(subscriptionService.getAllActivePlans());
    }
    
    @GetMapping("/plans/public")
    public ResponseEntity<List<PricingPlanDTO>> getPublicPlans() {
        return ResponseEntity.ok(subscriptionService.getAllActivePlans());
    }
    
    @GetMapping("/debug/auth")
    public ResponseEntity<Map<String, String>> debugAuth(HttpServletRequest req) {
        Map<String, String> debug = new HashMap<>();
        String authHeader = req.getHeader("Authorization");
        debug.put("authHeader", authHeader != null ? "Present" : "Missing");
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            String email = jwtProvider.extractEmail(token);
            debug.put("extractedEmail", email != null ? email : "null");
            if (email != null) {
                boolean userExists = userRepository.findByEmail(email).isPresent();
                debug.put("userExists", String.valueOf(userExists));
            }
        }
        return ResponseEntity.ok(debug);
    }
    
    @GetMapping("/plans/{planId}")
    public ResponseEntity<PricingPlanDTO> getPlanById(@PathVariable String planId) {
        return ResponseEntity.ok(subscriptionService.getPlanById(planId));
    }
    
    @GetMapping("/plans/name/{name}")
    public ResponseEntity<PricingPlanDTO> getPlanByName(@PathVariable String name) {
        return ResponseEntity.ok(subscriptionService.getPlanByName(name));
    }
    
    @GetMapping("/current")
    public ResponseEntity<SubscriptionDTO> getCurrentSubscription(HttpServletRequest req) {
        User user = getCurrentUser(req);
        SubscriptionDTO subscription = subscriptionService.getUserActiveSubscription(user.getId());
        
        if (subscription == null) {
            // Create default STARTER subscription for users who don't have one
            try {
                log.info("No active subscription found for user {}, creating default STARTER subscription", user.getEmail());
                subscription = subscriptionService.createDefaultSubscription(user.getId());
                log.info("Successfully created default subscription for user {}", user.getEmail());
            } catch (Exception e) {
                log.error("Failed to create default subscription for user {}: {}", user.getEmail(), e.getMessage(), e);
                return ResponseEntity.noContent().build();
            }
        }
        
        return ResponseEntity.ok(subscription);
    }
    
    @PostMapping
    public ResponseEntity<SubscriptionDTO> createSubscription(
            HttpServletRequest req,
            @RequestBody CreateSubscriptionRequest request) {
        User user = getCurrentUser(req);
        SubscriptionDTO subscription = subscriptionService.createSubscription(user.getId(), request);
        return ResponseEntity.ok(subscription);
    }
    
    @PutMapping("/upgrade")
    public ResponseEntity<SubscriptionDTO> upgradeSubscription(
            HttpServletRequest req,
            @RequestBody UpgradeSubscriptionRequest request) {
        User user = getCurrentUser(req);
        SubscriptionDTO subscription = subscriptionService.upgradeSubscription(user.getId(), request);
        return ResponseEntity.ok(subscription);
    }
    
    @PostMapping("/cancel")
    public ResponseEntity<SubscriptionDTO> cancelSubscription(
            HttpServletRequest req,
            @RequestBody Map<String, String> payload) {
        User user = getCurrentUser(req);
        String reason = payload.getOrDefault("reason", "User requested cancellation");
        SubscriptionDTO subscription = subscriptionService.cancelSubscription(user.getId(), reason);
        return ResponseEntity.ok(subscription);
    }
    
    @PostMapping("/reactivate")
    public ResponseEntity<SubscriptionDTO> reactivateSubscription(HttpServletRequest req) {
        User user = getCurrentUser(req);
        SubscriptionDTO subscription = subscriptionService.reactivateSubscription(user.getId());
        return ResponseEntity.ok(subscription);
    }
    
    @GetMapping("/history")
    public ResponseEntity<List<SubscriptionDTO>> getSubscriptionHistory(HttpServletRequest req) {
        User user = getCurrentUser(req);
        return ResponseEntity.ok(subscriptionService.getUserSubscriptionHistory(user.getId()));
    }
    
    @GetMapping("/payments")
    public ResponseEntity<List<PaymentHistoryDTO>> getPaymentHistory(HttpServletRequest req) {
        User user = getCurrentUser(req);
        return ResponseEntity.ok(subscriptionService.getUserPaymentHistory(user.getId()));
    }
    
    @GetMapping("/features/{featureName}")
    public ResponseEntity<Map<String, Boolean>> checkFeatureAccess(
            HttpServletRequest req,
            @PathVariable String featureName) {
        User user = getCurrentUser(req);
        boolean hasAccess = subscriptionService.hasFeatureAccess(user.getId(), featureName);
        
        Map<String, Boolean> response = new HashMap<>();
        response.put("hasAccess", hasAccess);
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/can-add-member")
    public ResponseEntity<Map<String, Boolean>> canAddTeamMember(
            HttpServletRequest req,
            @RequestParam int currentTeamSize) {
        User user = getCurrentUser(req);
        boolean canAdd = subscriptionService.canAddTeamMember(user.getId(), currentTeamSize);
        
        Map<String, Boolean> response = new HashMap<>();
        response.put("canAdd", canAdd);
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/can-upload")
    public ResponseEntity<Map<String, Boolean>> canUploadFile(
            HttpServletRequest req,
            @RequestParam long fileSize,
            @RequestParam long currentStorageUsed) {
        User user = getCurrentUser(req);
        boolean canUpload = subscriptionService.canUploadFile(user.getId(), fileSize, currentStorageUsed);
        
        Map<String, Boolean> response = new HashMap<>();
        response.put("canUpload", canUpload);
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/can-video-call")
    public ResponseEntity<Map<String, Boolean>> canStartVideoCall(HttpServletRequest req) {
        User user = getCurrentUser(req);
        boolean canStart = subscriptionService.canStartVideoCall(user.getId());
        
        Map<String, Boolean> response = new HashMap<>();
        response.put("canStart", canStart);
        
        return ResponseEntity.ok(response);
    }
}
