package com.syncora.subscription.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "pricing_plans")
public class PricingPlan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false, unique = true, length = 50)
    private String name; // STARTER, PROFESSIONAL, ENTERPRISE
    
    @Column(nullable = false, length = 50)
    private String displayName; // Starter, Professional, Enterprise
    
    @Column(length = 200)
    private String description;
    
    @Column(nullable = false)
    private Double monthlyPrice;
    
    @Column(nullable = false)
    private Double annualPrice; 
    
    // Limits and features
    @Column(nullable = false)
    private Integer maxTeamMembers; // -1 for unlimited
    
    @Column(nullable = false)
    private Long storageQuotaBytes; // -1 for unlimited
    
    @Column(nullable = false)
    private Integer videoCallDurationMinutes; // -1 for unlimited
    
    @Builder.Default
    @Column(nullable = false)
    private Boolean unlimitedMessages = true;
    
    @Builder.Default
    @Column(nullable = false)
    private Boolean advancedTaskManagement = false;
    
    @Builder.Default
    @Column(nullable = false)
    private Boolean aiFeaturesEnabled = false;
    
    @Builder.Default
    @Column(nullable = false)
    private Boolean customIntegrations = false;
    
    @Builder.Default
    @Column(nullable = false)
    private Boolean analyticsReporting = false;
    
    @Builder.Default
    @Column(nullable = false)
    private Boolean prioritySupport = false;
    
    @Builder.Default
    @Column(nullable = false)
    private Boolean ssoSaml = false;
    
    @Builder.Default
    @Column(nullable = false)
    private Boolean dedicatedAccountManager = false;
    
    @Builder.Default
    @Column(nullable = false)
    private Boolean customSla = false;
    
    @Builder.Default
    @Column(nullable = false)
    private Boolean onPremiseDeployment = false;
    
    @Builder.Default
    @Column(nullable = false)
    private Boolean phoneSupport = false;
    
    @Builder.Default
    @Column(nullable = false)
    private Boolean whiteboardCollaboration = false;
    
    @Column(nullable = false)
    private Integer displayOrder; // for ordering plans
    
    @Builder.Default
    @Column(nullable = false)
    private Boolean isActive = true;
    
    @Builder.Default
    @Column(nullable = false)
    private Boolean isPopular = false;
    
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
