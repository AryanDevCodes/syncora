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
public class PaymentHistoryDTO {
    private String id;
    private String userId;
    private String subscriptionId;
    private Double amount;
    private String currency;
    private String status;
    private String paymentMethod;
    private String description;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
}
