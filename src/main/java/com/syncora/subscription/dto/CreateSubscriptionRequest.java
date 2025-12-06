package com.syncora.subscription.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateSubscriptionRequest {
    private String planId;
    private String billingCycle; // MONTHLY or ANNUAL
    private Boolean startTrial; // Whether to start with trial
    private String paymentMethodId; // Stripe payment method ID
}
