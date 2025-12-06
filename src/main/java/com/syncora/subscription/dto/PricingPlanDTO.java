package com.syncora.subscription.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PricingPlanDTO {
    private String id;
    private String name;
    private String displayName;
    private String description;
    private Double monthlyPrice;
    private Double annualPrice;
    private String formattedMonthlyPrice;
    private String formattedAnnualPrice;
    private Integer maxTeamMembers;
    private String maxTeamMembersDisplay;
    private Long storageQuotaBytes;
    private String storageQuotaDisplay;
    private Integer videoCallDurationMinutes;
    private String videoCallDurationDisplay;
    private List<String> features;
    private Boolean isPopular;
    private Integer displayOrder;
    
    // Feature flags
    private Boolean unlimitedMessages;
    private Boolean advancedTaskManagement;
    private Boolean aiFeaturesEnabled;
    private Boolean customIntegrations;
    private Boolean analyticsReporting;
    private Boolean prioritySupport;
    private Boolean ssoSaml;
    private Boolean dedicatedAccountManager;
    private Boolean customSla;
    private Boolean onPremiseDeployment;
    private Boolean phoneSupport;
    private Boolean whiteboardCollaboration;
}
