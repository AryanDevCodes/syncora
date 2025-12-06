package com.syncora.subscription.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpgradeSubscriptionRequest {
    private String newPlanId;
    private String billingCycle; // MONTHLY or ANNUAL
    private Boolean immediate; // Whether to upgrade immediately or at period end
}
