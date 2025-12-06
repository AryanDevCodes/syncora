package com.syncora.subscription.service;

import com.syncora.subscription.dto.*;
import com.syncora.subscription.entity.PricingPlan;
import com.syncora.subscription.entity.UserSubscription;
import com.syncora.subscription.entity.PaymentHistory;
import com.syncora.subscription.mapper.SubscriptionMapper;
import com.syncora.subscription.repository.PricingPlanRepository;
import com.syncora.subscription.repository.UserSubscriptionRepository;
import com.syncora.subscription.repository.PaymentHistoryRepository;
import com.syncora.subscription.websocket.SubscriptionWebSocketController;
import com.syncora.user.entity.User;
import com.syncora.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionServiceImpl implements SubscriptionService {
    
    private final PricingPlanRepository planRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final PaymentHistoryRepository paymentRepository;
    private final UserRepository userRepository;
    private final SubscriptionMapper mapper;
    private final SubscriptionWebSocketController websocketController;
    
    @Override
    public List<PricingPlanDTO> getAllActivePlans() {
        return planRepository.findByIsActiveTrueOrderByDisplayOrder()
                .stream()
                .map(mapper::toPricingPlanDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public PricingPlanDTO getPlanById(String planId) {
        PricingPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Pricing plan not found"));
        return mapper.toPricingPlanDTO(plan);
    }
    
    @Override
    public PricingPlanDTO getPlanByName(String name) {
        PricingPlan plan = planRepository.findByName(name)
                .orElseThrow(() -> new RuntimeException("Pricing plan not found"));
        return mapper.toPricingPlanDTO(plan);
    }
    
    @Override
    public SubscriptionDTO getUserActiveSubscription(String userId) {
        UserSubscription subscription = subscriptionRepository
                .findActiveSubscriptionByUserId(userId)
                .orElse(null);
        return mapper.toSubscriptionDTO(subscription);
    }
    
    @Override
    @Transactional
    public SubscriptionDTO createDefaultSubscription(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if user already has a subscription
        UserSubscription existing = subscriptionRepository
                .findActiveSubscriptionByUserId(userId)
                .orElse(null);
        
        if (existing != null) {
            return mapper.toSubscriptionDTO(existing);
        }
        
        // Get STARTER plan
        PricingPlan starterPlan = planRepository.findByName("STARTER")
                .orElseThrow(() -> new RuntimeException("STARTER plan not found"));
        
        LocalDateTime now = LocalDateTime.now();
        UserSubscription subscription = UserSubscription.builder()
                .user(user)
                .plan(starterPlan)
                .status(UserSubscription.SubscriptionStatus.ACTIVE)
                .billingCycle(UserSubscription.BillingCycle.MONTHLY)
                .startDate(now)
                .endDate(now.plusYears(100)) // Free forever
                .autoRenew(true)
                .build();
        
        subscription = subscriptionRepository.save(subscription);
        
        // Update user's subscription plan
        user.setSubscriptionPlan("STARTER");
        userRepository.save(user);
        
        log.info("Created default STARTER subscription for user {}", userId);
        
        return mapper.toSubscriptionDTO(subscription);
    }
    
    @Override
    @Transactional
    public SubscriptionDTO createSubscription(String userId, CreateSubscriptionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        PricingPlan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new RuntimeException("Pricing plan not found"));
        
        // Check if user already has an active subscription
        subscriptionRepository.findActiveSubscriptionByUserId(userId)
                .ifPresent(existing -> {
                    throw new RuntimeException("User already has an active subscription");
                });
        
        LocalDateTime startDate = LocalDateTime.now();
        LocalDateTime endDate;
        LocalDateTime trialEndDate = null;
        UserSubscription.SubscriptionStatus status;
        
        // Handle trial
        if (Boolean.TRUE.equals(request.getStartTrial()) && !plan.getName().equals("STARTER")) {
            status = UserSubscription.SubscriptionStatus.TRIAL;
            trialEndDate = null; // No trial period
            endDate = trialEndDate;
        } else {
            status = UserSubscription.SubscriptionStatus.ACTIVE;
            endDate = "ANNUAL".equals(request.getBillingCycle()) ?
                    startDate.plusYears(1) : startDate.plusMonths(1);
        }
        
        UserSubscription subscription = UserSubscription.builder()
                .user(user)
                .plan(plan)
                .status(status)
                .billingCycle(UserSubscription.BillingCycle.valueOf(request.getBillingCycle()))
                .startDate(startDate)
                .endDate(endDate)
                .trialEndDate(trialEndDate)
                .autoRenew(true)
                .build();
        
        subscription = subscriptionRepository.save(subscription);
        
        // Update user's subscription plan
        user.setSubscriptionPlan(plan.getName());
        userRepository.save(user);
        
        log.info("Created subscription for user {}: plan={}, status={}", userId, plan.getName(), status);
        
        return mapper.toSubscriptionDTO(subscription);
    }
    
    @Override
    @Transactional
    public SubscriptionDTO upgradeSubscription(String userId, UpgradeSubscriptionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        UserSubscription currentSubscription = subscriptionRepository
                .findActiveSubscriptionByUserId(userId)
                .orElseThrow(() -> new RuntimeException("No active subscription found"));
        
        PricingPlan newPlan = planRepository.findById(request.getNewPlanId())
                .orElseThrow(() -> new RuntimeException("Pricing plan not found"));
        
        // Cancel current subscription
        currentSubscription.setStatus(UserSubscription.SubscriptionStatus.CANCELLED);
        currentSubscription.setCancelledAt(LocalDateTime.now());
        subscriptionRepository.save(currentSubscription);
        
        // Send WebSocket notification for cancellation
        try {
            websocketController.sendSubscriptionUpdate(Long.parseLong(userId), 
                mapper.toSubscriptionDTO(currentSubscription));
        } catch (Exception e) {
            log.error("Failed to send WebSocket notification for subscription upgrade cancellation", e);
        }
        
        // Create new subscription
        LocalDateTime startDate = Boolean.TRUE.equals(request.getImmediate()) ?
                LocalDateTime.now() : currentSubscription.getEndDate();
        
        LocalDateTime endDate = "ANNUAL".equals(request.getBillingCycle()) ?
                startDate.plusYears(1) : startDate.plusMonths(1);
        
        UserSubscription newSubscription = UserSubscription.builder()
                .user(user)
                .plan(newPlan)
                .status(UserSubscription.SubscriptionStatus.ACTIVE)
                .billingCycle(UserSubscription.BillingCycle.valueOf(request.getBillingCycle()))
                .startDate(startDate)
                .endDate(endDate)
                .autoRenew(true)
                .build();
        
        newSubscription = subscriptionRepository.save(newSubscription);
        
        // Update user's subscription plan
        user.setSubscriptionPlan(newPlan.getName());
        userRepository.save(user);
        
        log.info("Upgraded subscription for user {}: old={}, new={}", 
                userId, currentSubscription.getPlan().getName(), newPlan.getName());
        
        // Send WebSocket notification for new subscription
        try {
            SubscriptionDTO dto = mapper.toSubscriptionDTO(newSubscription);
            websocketController.sendSubscriptionUpdate(Long.parseLong(userId), dto);
        } catch (Exception e) {
            log.error("Failed to send WebSocket notification for subscription upgrade", e);
        }
        
        return mapper.toSubscriptionDTO(newSubscription);
    }
    
    @Override
    @Transactional
    public SubscriptionDTO cancelSubscription(String userId, String reason) {
        UserSubscription subscription = subscriptionRepository
                .findActiveSubscriptionByUserId(userId)
                .orElseThrow(() -> new RuntimeException("No active subscription found"));
        
        subscription.setStatus(UserSubscription.SubscriptionStatus.CANCELLED);
        subscription.setCancelledAt(LocalDateTime.now());
        subscription.setCancellationReason(reason);
        subscription.setAutoRenew(false);
        
        subscriptionRepository.save(subscription);
        
        log.info("Cancelled subscription for user {}: reason={}", userId, reason);
        
        // Create new STARTER subscription after cancellation
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        PricingPlan starterPlan = planRepository.findByName("STARTER")
                .orElseThrow(() -> new RuntimeException("STARTER plan not found"));
        
        UserSubscription newSubscription = new UserSubscription();
        newSubscription.setUser(user);
        newSubscription.setPlan(starterPlan);
        newSubscription.setStatus(UserSubscription.SubscriptionStatus.ACTIVE);
        newSubscription.setBillingCycle(UserSubscription.BillingCycle.MONTHLY); // Set default billing cycle
        newSubscription.setStartDate(LocalDateTime.now());
        newSubscription.setEndDate(LocalDateTime.now().plusYears(100)); // Free forever
        newSubscription.setAutoRenew(false);
        newSubscription.setStorageUsedMb(subscription.getStorageUsedMb()); // Preserve current storage usage
        
        newSubscription = subscriptionRepository.save(newSubscription);
        
        log.info("Created STARTER subscription for user {} after cancellation", userId);
        
        // Send WebSocket notification with new STARTER subscription
        try {
            SubscriptionDTO dto = mapper.toSubscriptionDTO(newSubscription);
            websocketController.sendSubscriptionUpdate(Long.parseLong(userId), dto);
        } catch (Exception e) {
            log.error("Failed to send WebSocket notification for subscription cancellation", e);
        }
        
        return mapper.toSubscriptionDTO(newSubscription);
    }
    
    @Override
    @Transactional
    public SubscriptionDTO reactivateSubscription(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<UserSubscription> subscriptions = subscriptionRepository.findByUserOrderByCreatedAtDesc(user);
        UserSubscription lastSubscription = subscriptions.isEmpty() ? null : subscriptions.get(0);
        
        if (lastSubscription == null) {
            throw new RuntimeException("No subscription history found");
        }
        
        // Reactivate the last subscription
        lastSubscription.setStatus(UserSubscription.SubscriptionStatus.ACTIVE);
        lastSubscription.setCancelledAt(null);
        lastSubscription.setAutoRenew(true);
        
        // Extend the end date
        LocalDateTime now = LocalDateTime.now();
        if (lastSubscription.getEndDate().isBefore(now)) {
            LocalDateTime newEndDate = lastSubscription.getBillingCycle() == UserSubscription.BillingCycle.ANNUAL ?
                    now.plusYears(1) : now.plusMonths(1);
            lastSubscription.setEndDate(newEndDate);
        }
        
        lastSubscription = subscriptionRepository.save(lastSubscription);
        
        // Send WebSocket notification
        try {
            SubscriptionDTO dto = mapper.toSubscriptionDTO(lastSubscription);
            websocketController.sendSubscriptionUpdate(Long.parseLong(userId), dto);
        } catch (Exception e) {
            log.error("Failed to send WebSocket notification for subscription reactivation", e);
        }
        
        log.info("Reactivated subscription for user {}", userId);
        
        return mapper.toSubscriptionDTO(lastSubscription);
    }
    
    @Override
    public List<SubscriptionDTO> getUserSubscriptionHistory(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return subscriptionRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(mapper::toSubscriptionDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<PaymentHistoryDTO> getUserPaymentHistory(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return paymentRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(mapper::toPaymentHistoryDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public boolean hasFeatureAccess(String userId, String featureName) {
        UserSubscription subscription = subscriptionRepository
                .findActiveSubscriptionByUserId(userId)
                .orElse(null);
        
        if (subscription == null || !subscription.isActive()) {
            return false;
        }
        
        PricingPlan plan = subscription.getPlan();
        
        return switch (featureName.toUpperCase()) {
            case "AI_FEATURES" -> plan.getAiFeaturesEnabled();
            case "ADVANCED_TASK_MANAGEMENT" -> plan.getAdvancedTaskManagement();
            case "CUSTOM_INTEGRATIONS" -> plan.getCustomIntegrations();
            case "ANALYTICS" -> plan.getAnalyticsReporting();
            case "PRIORITY_SUPPORT" -> plan.getPrioritySupport();
            case "SSO_SAML" -> plan.getSsoSaml();
            case "PHONE_SUPPORT" -> plan.getPhoneSupport();
            default -> false;
        };
    }
    
    @Override
    public boolean canAddTeamMember(String userId, int currentTeamSize) {
        UserSubscription subscription = subscriptionRepository
                .findActiveSubscriptionByUserId(userId)
                .orElse(null);
        
        if (subscription == null || !subscription.isActive()) {
            return false;
        }
        
        PricingPlan plan = subscription.getPlan();
        int maxMembers = plan.getMaxTeamMembers();
        
        // -1 means unlimited
        return maxMembers == -1 || currentTeamSize < maxMembers;
    }
    
    @Override
    public boolean canUploadFile(String userId, long fileSize, long currentStorageUsed) {
        UserSubscription subscription = subscriptionRepository
                .findActiveSubscriptionByUserId(userId)
                .orElse(null);
        
        if (subscription == null || !subscription.isActive()) {
            return false;
        }
        
        PricingPlan plan = subscription.getPlan();
        long storageQuota = plan.getStorageQuotaBytes();
        
        // -1 means unlimited
        return storageQuota == -1 || (currentStorageUsed + fileSize) <= storageQuota;
    }
    
    @Override
    public boolean canStartVideoCall(String userId) {
        UserSubscription subscription = subscriptionRepository
                .findActiveSubscriptionByUserId(userId)
                .orElse(null);
        
        if (subscription == null || !subscription.isActive()) {
            return false;
        }
        
        // Check if unlimited or has video call duration
        PricingPlan plan = subscription.getPlan();
        return plan.getVideoCallDurationMinutes() != 0;
    }
    
    @Override
    @Transactional
    public void processExpiredSubscriptions() {
        List<UserSubscription> expired = subscriptionRepository
                .findExpiredSubscriptions(LocalDateTime.now());
        
        for (UserSubscription subscription : expired) {
            subscription.setStatus(UserSubscription.SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(subscription);
            
            // Downgrade user to free plan
            User user = subscription.getUser();
            PricingPlan starterPlan = planRepository.findByName("STARTER")
                    .orElse(null);
            
            if (starterPlan != null) {
                user.setSubscriptionPlan(starterPlan.getName());
                userRepository.save(user);
                
                log.info("Expired subscription for user {}, downgraded to STARTER", user.getId());
            }
        }
    }
    
    @Override
    @Transactional
    public void processExpiredTrials() {
        List<UserSubscription> expiredTrials = subscriptionRepository
                .findExpiredTrials(LocalDateTime.now());
        
        for (UserSubscription subscription : expiredTrials) {
            subscription.setStatus(UserSubscription.SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(subscription);
            
            // Downgrade user to free plan
            User user = subscription.getUser();
            PricingPlan starterPlan = planRepository.findByName("STARTER")
                    .orElse(null);
            
            if (starterPlan != null) {
                user.setSubscriptionPlan(starterPlan.getName());
                userRepository.save(user);
                
                log.info("Trial expired for user {}, downgraded to STARTER", user.getId());
            }
        }
    }
}
