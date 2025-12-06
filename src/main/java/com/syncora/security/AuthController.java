package com.syncora.security;

import com.syncora.common.response.ApiResponse;
import com.syncora.security.dto.JwtResponse;
import com.syncora.security.dto.LoginRequest;
import com.syncora.security.dto.RefreshTokenRequest;
import com.syncora.security.dto.SignupRequest;
import com.syncora.security.dto.AblyTokenResponse;
import com.syncora.communication.ably.AblyTokenService;
import com.syncora.security.repository.RefreshTokenRepository;
import com.syncora.user.repository.UserRepository;
import com.syncora.user.entity.User;
import io.ably.lib.types.AblyException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AblyTokenService ablyTokenService;
    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;

    /** -------------------- SIGNUP -------------------- */
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<Void>> signup(@Valid @RequestBody SignupRequest request) {
        authService.signUp(request);
        log.info("New user registered with email: {}", request.getEmail());
        return ResponseEntity.ok(new ApiResponse<>(true, "User registered successfully", null));
    }

    /** -------------------- LOGIN -------------------- */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<JwtResponse>> login(@Valid @RequestBody LoginRequest request) {
        JwtResponse jwtResponse = authService.login(request);
        log.info("User logged in: {}", request.getEmail());
        return ResponseEntity.ok(new ApiResponse<>(true, "User Logged", jwtResponse));
    }

    /** -------------------- REFRESH TOKEN -------------------- */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<JwtResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();

        if (refreshToken == null || refreshToken.trim().isEmpty()) {
            log.warn("Refresh request rejected: missing token");
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Missing refresh token", null));
        }

        try {
            JwtResponse jwtResponse = authService.refreshToken(refreshToken);
            log.info("Access token refreshed for token: {}", refreshToken.substring(0, 20) + "...");
            return ResponseEntity.ok(new ApiResponse<>(true, "Token refreshed successfully", jwtResponse));
        } catch (Exception e) {
            log.warn("Refresh failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    /** -------------------- LOGOUT -------------------- */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@Valid @RequestBody RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();

        if (refreshToken == null || refreshToken.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Missing refresh token", null));
        }

        // Mark the refresh token as revoked if found
        refreshTokenRepository.findByToken(refreshToken).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
            log.info("Refresh token revoked for user logout");
        });

        return ResponseEntity.ok(new ApiResponse<>(true, "User logged out successfully", null));
    }

    /** -------------------- ABLY TOKEN -------------------- */
    @GetMapping("/ably-token")
    public ResponseEntity<ApiResponse<AblyTokenResponse>> getAblyToken(HttpServletRequest request) {
        try {
            // Extract token from request header
            String token = SecurityUtils.extractToken(request);
            if (token == null) {
                log.warn("No JWT token found in Ably token request");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ApiResponse<>(false, "No authentication token provided", null));
            }

            // Validate token and extract user email
            String userEmail = jwtProvider.extractEmail(token);
            if (userEmail == null) {
                log.warn("Invalid JWT token in Ably token request");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ApiResponse<>(false, "Invalid authentication token", null));
            }

            // Verify user exists
            User user = userRepository.findByEmail(userEmail).orElse(null);
            if (user == null) {
                log.warn("User not found for Ably token request: {}", userEmail);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ApiResponse<>(false, "User not found", null));
            }

            log.info("Generating Ably token for user: {}", userEmail);

            // Generate token for the user
            String ablyToken = ablyTokenService.generateToken(userEmail);
            log.info("Ably token generated successfully for user: {}", userEmail);

            AblyTokenResponse response = new AblyTokenResponse(
                ablyToken,
                userEmail, // clientId
                System.currentTimeMillis() + 3600000, // expires in 1 hour
                "{\"*\":[\"*\"]}" // full capabilities
            );

            log.info("Ably token response created successfully");
            return ResponseEntity.ok(new ApiResponse<>(true, "Ably token generated successfully", response));

        } catch (AblyException e) {
            log.error("Failed to generate Ably token - AblyException", e);
            log.error("Ably error info: {}", e.errorInfo);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Failed to generate Ably token: " + e.getMessage(), null));
        } catch (Exception e) {
            log.error("Unexpected error generating Ably token", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Unexpected error: " + e.getMessage(), null));
        }
    }

}
