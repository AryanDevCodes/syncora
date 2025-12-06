package com.syncora.subscription.exception;

public class SubscriptionLimitException extends RuntimeException {
    
    private final String limitType;
    private final String requiredPlan;
    
    public SubscriptionLimitException(String message, String limitType, String requiredPlan) {
        super(message);
        this.limitType = limitType;
        this.requiredPlan = requiredPlan;
    }
    
    public SubscriptionLimitException(String message) {
        super(message);
        this.limitType = null;
        this.requiredPlan = null;
    }
    
    public String getLimitType() {
        return limitType;
    }
    
    public String getRequiredPlan() {
        return requiredPlan;
    }
}
