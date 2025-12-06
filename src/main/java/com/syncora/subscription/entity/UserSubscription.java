package com.syncora.subscription.entity;

import com.syncora.user.entity.User;
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
@Table(name = "user_subscriptions")
public class UserSubscription {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "plan_id", nullable = false)
    private PricingPlan plan;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SubscriptionStatus status; // ACTIVE, CANCELLED, EXPIRED, TRIAL, PENDING
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BillingCycle billingCycle; // MONTHLY, ANNUAL
    
    @Column(nullable = false)
    private LocalDateTime startDate;
    
    @Column(nullable = false)
    private LocalDateTime endDate;
    
    private LocalDateTime trialEndDate;
    
    private LocalDateTime cancelledAt;
    
    @Column(length = 500)
    private String cancellationReason;
    
    @Builder.Default
    @Column(nullable = false)
    private Boolean autoRenew = true;
    
    @Column(length = 100)
    private String stripeSubscriptionId; // for payment processing
    
    @Column(length = 100)
    private String stripeCustomerId;
    
    @Builder.Default
    @Column(nullable = false)
    private Long storageUsedMb = 0L; // Storage used in megabytes
    
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
    
    public enum SubscriptionStatus {
        ACTIVE,
        CANCELLED,
        EXPIRED,
        TRIAL,
        PENDING
    }
    
    public enum BillingCycle {
        MONTHLY,
        ANNUAL
    }
    
    public boolean isActive() {
        return status == SubscriptionStatus.ACTIVE && 
               LocalDateTime.now().isBefore(endDate);
    }
    
    public boolean isInTrial() {
        return status == SubscriptionStatus.TRIAL && 
               trialEndDate != null && 
               LocalDateTime.now().isBefore(trialEndDate);
    }
}
