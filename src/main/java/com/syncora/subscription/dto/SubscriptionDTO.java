package com.syncora.subscription.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SubscriptionDTO {
    private String id;
    private String userId;
    private PricingPlanDTO plan;
    private String status;
    private String billingCycle;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime trialEndDate;
    private Boolean autoRenew;
    private Boolean isActive;
    private Boolean isInTrial;
    private Integer daysRemaining;
    private Long storageUsedMb;
}
