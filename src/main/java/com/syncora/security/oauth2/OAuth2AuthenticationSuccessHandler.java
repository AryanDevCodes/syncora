package com.syncora.security.oauth2;

import com.syncora.security.JwtProvider;
import com.syncora.user.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Objects;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtProvider jwtProvider;

    @Value("${oauth2.frontend.redirect-url}")
    private String frontendRedirectUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        if (response.isCommitted()) {
            log.debug("Response has already been committed. Unable to redirect to target URL.");
            return;
        }

        CustomOAuth2User oauth2User = (CustomOAuth2User) authentication.getPrincipal();
        User user = oauth2User.getUser();

    log.info("OAuth2AuthenticationSuccessHandler: user={}, provider={}, providerId={}", user.getEmail(), user.getProvider(), user.getProviderId());

    // Generate JWT tokens
    String accessToken = jwtProvider.generateAccessToken(user.getEmail());
    String refreshToken = jwtProvider.generateRefreshToken(user.getEmail());
    log.info("Generated JWT accessToken: {}", accessToken);
    log.info("Generated JWT refreshToken: {}", refreshToken);

    // Build redirect URL with tokens
    String redirectUrl = Objects.requireNonNull(frontendRedirectUrl, "frontendRedirectUrl must not be null");
    UriComponentsBuilder uriBuilder = UriComponentsBuilder.fromUriString(redirectUrl)
        .queryParam("accessToken", accessToken)
        .queryParam("refreshToken", refreshToken)
        .queryParam("userId", user.getId())
        .queryParam("email", user.getEmail());
    
    // Add avatarUrl if available
    if (user.getAvatarUrl() != null && !user.getAvatarUrl().isEmpty()) {
        uriBuilder.queryParam("avatarUrl", user.getAvatarUrl());
    }
    
    String targetUrl = uriBuilder.build().toUriString();

    log.info("OAuth2 authentication successful for user: {}. Redirecting to: {}", user.getEmail(), targetUrl);

    getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
