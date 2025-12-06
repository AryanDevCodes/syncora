package com.syncora.subscription.repository;

import com.syncora.subscription.entity.PaymentHistory;
import com.syncora.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentHistoryRepository extends JpaRepository<PaymentHistory, String> {
    
    List<PaymentHistory> findByUserOrderByCreatedAtDesc(User user);
    
    List<PaymentHistory> findByUserAndStatusOrderByCreatedAtDesc(User user, PaymentHistory.PaymentStatus status);
    
    List<PaymentHistory> findBySubscriptionIdOrderByCreatedAtDesc(String subscriptionId);
}
