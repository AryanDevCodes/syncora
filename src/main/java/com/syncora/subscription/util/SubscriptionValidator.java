package com.syncora.subscription.util;

import com.syncora.subscription.exception.SubscriptionLimitException;
import com.syncora.subscription.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SubscriptionValidator {
    
    private final SubscriptionService subscriptionService;
    
    public void validateFeatureAccess(String userId, String featureName) {
        if (!subscriptionService.hasFeatureAccess(userId, featureName)) {
            throw new SubscriptionLimitException(
                "This feature requires a higher subscription plan",
                featureName,
                "PROFESSIONAL"
            );
        }
    }
    
    public void validateTeamMemberLimit(String userId, int currentTeamSize) {
        if (!subscriptionService.canAddTeamMember(userId, currentTeamSize)) {
            throw new SubscriptionLimitException(
                "You have reached the maximum number of team members for your plan",
                "TEAM_MEMBERS",
                "PROFESSIONAL"
            );
        }
    }
    
    public void validateStorageLimit(String userId, long fileSize, long currentStorageUsed) {
        if (!subscriptionService.canUploadFile(userId, fileSize, currentStorageUsed)) {
            throw new SubscriptionLimitException(
                "You have reached your storage limit. Please upgrade your plan",
                "STORAGE",
                "PROFESSIONAL"
            );
        }
    }
    
    public void validateVideoCallAccess(String userId) {
        if (!subscriptionService.canStartVideoCall(userId)) {
            throw new SubscriptionLimitException(
                "Video calls are not available on your current plan",
                "VIDEO_CALLS",
                "STARTER"
            );
        }
    }
}
