package com.syncora.communication.chat.dto;

/**
 * Response DTO for user token
 */
public class UserTokenResponse {
    private String accessToken;
    private Long expiresIn;
    private String username;

    public UserTokenResponse() {}

    public UserTokenResponse(String accessToken, Long expiresIn, String username) {
        this.accessToken = accessToken;
        this.expiresIn = expiresIn;
        this.username = username;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public Long getExpiresIn() {
        return expiresIn;
    }

    public void setExpiresIn(Long expiresIn) {
        this.expiresIn = expiresIn;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}
