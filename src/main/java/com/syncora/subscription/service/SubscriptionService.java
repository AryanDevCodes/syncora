package com.syncora.subscription.service;

import com.syncora.subscription.dto.*;
import com.syncora.subscription.entity.UserSubscription;

import java.util.List;

public interface SubscriptionService {
    
    // Pricing Plans
    List<PricingPlanDTO> getAllActivePlans();
    PricingPlanDTO getPlanById(String planId);
    PricingPlanDTO getPlanByName(String name);
    
    // User Subscriptions
    SubscriptionDTO getUserActiveSubscription(String userId);
    SubscriptionDTO createDefaultSubscription(String userId);
    SubscriptionDTO createSubscription(String userId, CreateSubscriptionRequest request);
    SubscriptionDTO upgradeSubscription(String userId, UpgradeSubscriptionRequest request);
    SubscriptionDTO cancelSubscription(String userId, String reason);
    SubscriptionDTO reactivateSubscription(String userId);
    List<SubscriptionDTO> getUserSubscriptionHistory(String userId);
    
    // Payment History
    List<PaymentHistoryDTO> getUserPaymentHistory(String userId);
    
    // Feature Access Validation
    boolean hasFeatureAccess(String userId, String featureName);
    boolean canAddTeamMember(String userId, int currentTeamSize);
    boolean canUploadFile(String userId, long fileSize, long currentStorageUsed);
    boolean canStartVideoCall(String userId);
    
    // Subscription Management
    void processExpiredSubscriptions();
    void processExpiredTrials();
}
