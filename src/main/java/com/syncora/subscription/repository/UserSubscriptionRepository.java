package com.syncora.subscription.repository;

import com.syncora.subscription.entity.UserSubscription;
import com.syncora.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, String> {
    
    Optional<UserSubscription> findByUserAndStatus(User user, UserSubscription.SubscriptionStatus status);
    
    @Query("SELECT us FROM UserSubscription us WHERE us.user.id = :userId " +
           "AND us.status IN ('ACTIVE', 'TRIAL') ORDER BY us.createdAt DESC")
    Optional<UserSubscription> findActiveSubscriptionByUserId(String userId);
    
    List<UserSubscription> findByUser(User user);
    
    List<UserSubscription> findByUserOrderByCreatedAtDesc(User user);
    
    @Query("SELECT us FROM UserSubscription us WHERE us.endDate < :now " +
           "AND us.status = 'ACTIVE' AND us.autoRenew = false")
    List<UserSubscription> findExpiredSubscriptions(LocalDateTime now);
    
    @Query("SELECT us FROM UserSubscription us WHERE us.trialEndDate < :now " +
           "AND us.status = 'TRIAL'")
    List<UserSubscription> findExpiredTrials(LocalDateTime now);
}
