package com.syncora.security.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AblyTokenResponse {
    private String token;
    private String clientId;
    private long expiresAt;
    private String capability;
}