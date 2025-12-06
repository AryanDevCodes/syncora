package com.syncora.subscription.mapper;

import com.syncora.subscription.dto.PricingPlanDTO;
import com.syncora.subscription.dto.SubscriptionDTO;
import com.syncora.subscription.dto.PaymentHistoryDTO;
import com.syncora.subscription.entity.PricingPlan;
import com.syncora.subscription.entity.UserSubscription;
import com.syncora.subscription.entity.PaymentHistory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Component
public class SubscriptionMapper {
    
    public PricingPlanDTO toPricingPlanDTO(PricingPlan plan) {
        if (plan == null) {
            return null;
        }
        
        List<String> features = buildFeatureList(plan);
        
        return PricingPlanDTO.builder()
                .id(plan.getId())
                .name(plan.getName())
                .displayName(plan.getDisplayName())
                .description(plan.getDescription())
                .monthlyPrice(plan.getMonthlyPrice())
                .annualPrice(plan.getAnnualPrice())
                .formattedMonthlyPrice(formatPrice(plan.getMonthlyPrice()))
                .formattedAnnualPrice(formatPrice(plan.getAnnualPrice()))
                .maxTeamMembers(plan.getMaxTeamMembers())
                .maxTeamMembersDisplay(formatTeamMembers(plan.getMaxTeamMembers()))
                .storageQuotaBytes(plan.getStorageQuotaBytes())
                .storageQuotaDisplay(formatStorage(plan.getStorageQuotaBytes()))
                .videoCallDurationMinutes(plan.getVideoCallDurationMinutes())
                .videoCallDurationDisplay(formatVideoDuration(plan.getVideoCallDurationMinutes()))
                .features(features)
                .isPopular(plan.getIsPopular())
                .displayOrder(plan.getDisplayOrder())
                .unlimitedMessages(plan.getUnlimitedMessages())
                .advancedTaskManagement(plan.getAdvancedTaskManagement())
                .aiFeaturesEnabled(plan.getAiFeaturesEnabled())
                .customIntegrations(plan.getCustomIntegrations())
                .analyticsReporting(plan.getAnalyticsReporting())
                .prioritySupport(plan.getPrioritySupport())
                .ssoSaml(plan.getSsoSaml())
                .dedicatedAccountManager(plan.getDedicatedAccountManager())
                .customSla(plan.getCustomSla())
                .onPremiseDeployment(plan.getOnPremiseDeployment())
                .phoneSupport(plan.getPhoneSupport())
                .whiteboardCollaboration(plan.getWhiteboardCollaboration())
                .build();
    }
    
    public SubscriptionDTO toSubscriptionDTO(UserSubscription subscription) {
        if (subscription == null) {
            return null;
        }
        
        int daysRemaining = subscription.getEndDate() != null ?
                (int) ChronoUnit.DAYS.between(LocalDateTime.now(), subscription.getEndDate()) : 0;
        
        return SubscriptionDTO.builder()
                .id(subscription.getId())
                .userId(subscription.getUser().getId())
                .plan(toPricingPlanDTO(subscription.getPlan()))
                .status(subscription.getStatus().name())
                .billingCycle(subscription.getBillingCycle().name())
                .startDate(subscription.getStartDate())
                .endDate(subscription.getEndDate())
                .trialEndDate(subscription.getTrialEndDate())
                .autoRenew(subscription.getAutoRenew())
                .isActive(subscription.isActive())
                .isInTrial(subscription.isInTrial())
                .daysRemaining(Math.max(0, daysRemaining))
                .storageUsedMb(subscription.getStorageUsedMb())
                .build();
    }
    
    public PaymentHistoryDTO toPaymentHistoryDTO(PaymentHistory payment) {
        if (payment == null) {
            return null;
        }
        
        return PaymentHistoryDTO.builder()
                .id(payment.getId())
                .userId(payment.getUser().getId())
                .subscriptionId(payment.getSubscription().getId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus().name())
                .paymentMethod(payment.getPaymentMethod().name())
                .description(payment.getDescription())
                .paidAt(payment.getPaidAt())
                .createdAt(payment.getCreatedAt())
                .build();
    }
    
    private List<String> buildFeatureList(PricingPlan plan) {
        List<String> features = new ArrayList<>();
        
        // Team members
        features.add(formatTeamMembers(plan.getMaxTeamMembers()));
        
        // Messages
        if (plan.getUnlimitedMessages()) {
            features.add("Unlimited messages");
        }
        
        // Video calls
        features.add(formatVideoDuration(plan.getVideoCallDurationMinutes()));
        
        // Storage
        features.add(formatStorage(plan.getStorageQuotaBytes()));
        
        // Task management
        if (plan.getAdvancedTaskManagement()) {
            features.add("Advanced task management");
        } else {
            features.add("Basic task boards");
        }
        
        // AI features
        if (plan.getAiFeaturesEnabled()) {
            features.add("AI-powered features");
        }
        
        // Support
        if (plan.getPhoneSupport()) {
            features.add("24/7 phone support");
        } else if (plan.getPrioritySupport()) {
            features.add("Priority support");
        } else {
            features.add("Community support");
        }
        
        // Integrations
        if (plan.getCustomIntegrations()) {
            features.add("Custom integrations");
        }
        
        // Analytics
        if (plan.getAnalyticsReporting()) {
            features.add("Analytics & reporting");
        }
        
        // Enterprise features
        if (plan.getSsoSaml()) {
            features.add("SSO & SAML");
        }
        
        if (plan.getDedicatedAccountManager()) {
            features.add("Dedicated account manager");
        }
        
        if (plan.getCustomSla()) {
            features.add("Custom SLA");
        }
        
        if (plan.getOnPremiseDeployment()) {
            features.add("On-premise deployment");
        }
        
        return features;
    }
    
    private String formatTeamMembers(Integer max) {
        if (max == null || max <= 0) {
            return "Unlimited team members";
        }
        return "Up to " + max + " team members";
    }
    
    private String formatStorage(Long bytes) {
        if (bytes == null || bytes <= 0) {
            return "Unlimited storage";
        }
        
        long gb = bytes / (1024 * 1024 * 1024);
        if (gb > 0) {
            return gb + " GB storage";
        }
        
        long mb = bytes / (1024 * 1024);
        return mb + " MB storage";
    }
    
    private String formatVideoDuration(Integer minutes) {
        if (minutes == null || minutes <= 0) {
            return "Unlimited video calls";
        }
        return "Video calls up to " + minutes + " mins";
    }
    
    private String formatPrice(Double price) {
        if (price == null || price == 0) {
            return "$0";
        }
        if (price == -1) {
            return "Custom";
        }
        return String.format("$%.2f", price);
    }
}
