package com.syncora.security.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class JwtResponse {
    private String token;                    // JWT access token
    private Long expiration;                 // JWT expiration time in ms
    private String refreshToken;             // Refresh token for getting new JWT
}
