package com.syncora.subscription.repository;

import com.syncora.subscription.entity.PricingPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PricingPlanRepository extends JpaRepository<PricingPlan, String> {
    
    Optional<PricingPlan> findByName(String name);
    
    List<PricingPlan> findByIsActiveTrue();
    
    List<PricingPlan> findByIsActiveTrueOrderByDisplayOrder();
}
