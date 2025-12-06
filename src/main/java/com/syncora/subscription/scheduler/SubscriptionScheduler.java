package com.syncora.subscription.scheduler;

import com.syncora.subscription.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class SubscriptionScheduler {
    
    private final SubscriptionService subscriptionService;
    
    /**
     * Process expired subscriptions every day at 2 AM
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void processExpiredSubscriptions() {
        log.info("Starting scheduled task: process expired subscriptions");
        try {
            subscriptionService.processExpiredSubscriptions();
            log.info("Successfully processed expired subscriptions");
        } catch (Exception e) {
            log.error("Error processing expired subscriptions", e);
        }
    }
    
    /**
     * Process expired trials every day at 2:30 AM
     */
    @Scheduled(cron = "0 30 2 * * *")
    public void processExpiredTrials() {
        log.info("Starting scheduled task: process expired trials");
        try {
            subscriptionService.processExpiredTrials();
            log.info("Successfully processed expired trials");
        } catch (Exception e) {
            log.error("Error processing expired trials", e);
        }
    }
}
