package com.syncora.security;

import com.syncora.common.exception.ApiException;
import com.syncora.communication.chat.service.ChatUserService;
import com.syncora.security.dto.JwtResponse;
import com.syncora.security.dto.LoginRequest;
import com.syncora.security.dto.SignupRequest;
import com.syncora.security.entity.RefreshToken;
import com.syncora.security.repository.RefreshTokenRepository;
import com.syncora.subscription.entity.PricingPlan;
import com.syncora.subscription.entity.UserSubscription;
import com.syncora.subscription.repository.PricingPlanRepository;
import com.syncora.subscription.repository.UserSubscriptionRepository;
import com.syncora.user.entity.User;
import com.syncora.user.repository.UserRepository;
import com.syncora.communication.video.utils.TokenUtils;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;


@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PricingPlanRepository pricingPlanRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final TokenUtils tokenUtils;
    private final ChatUserService chatUserService;

    // ------------------ LOGIN ------------------
    @Override
    @Transactional
    public JwtResponse login(LoginRequest loginRequest) {
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new ApiException("Invalid credentials"));

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash())) {
            throw new ApiException("Invalid credentials");
        }

        if (!user.isActive()) {
            throw new ApiException("User account is disabled");
        }

        // Invalidate old refresh tokens for security
        refreshTokenRepository.deleteByUser(user);

        // Generate tokens
        String accessToken = jwtProvider.generateAccessToken(user.getEmail());
        String refreshToken = jwtProvider.generateRefreshToken(user.getEmail());

        // Save refresh token in DB
        RefreshToken entity = RefreshToken.builder()
                .token(refreshToken)
                .user(user)
                .expiryDate(Instant.now().plusMillis(jwtProvider.getRefreshExpiration()))
                .revoked(false)
                .build();
        refreshTokenRepository.save(entity);

        long accessExpiry = System.currentTimeMillis() + jwtProvider.getAccessExpiration();

        log.info("User {} logged in successfully", user.getEmail());
        return new JwtResponse(accessToken, accessExpiry, refreshToken);
    }

    // ------------------ SIGNUP ------------------
    @Override
    @Transactional
    public void signUp(SignupRequest signupRequest) {
        if (userRepository.existsByEmail(signupRequest.getEmail())) {
            throw new ApiException("Email already registered");
        }

        User user = User.builder()
                .email(signupRequest.getEmail())
                .passwordHash(passwordEncoder.encode(signupRequest.getPassword()))
                .firstName(signupRequest.getFirstName())
                .lastName(signupRequest.getLastName())
                .role("ROLE_USER")
                .isActive(true)
                .subscriptionPlan("STARTER")
                .storageUsedBytes(0L)
                .build();

        // Persist the user so JPA assigns the generated UUID id
        userRepository.save(user);
        log.info("New user registered in Syncora: {} with ID: {}", user.getEmail(), user.getId());
        
        // Create default STARTER subscription for new user
        try {
            PricingPlan starterPlan = pricingPlanRepository.findByName("STARTER")
                    .orElseThrow(() -> new ApiException("STARTER plan not found. Please run subscription-data.sql"));
            
            UserSubscription subscription = UserSubscription.builder()
                    .user(user)
                    .plan(starterPlan)
                    .status(UserSubscription.SubscriptionStatus.ACTIVE)
                    .billingCycle(UserSubscription.BillingCycle.MONTHLY)
                    .startDate(LocalDateTime.now())
                    .endDate(LocalDateTime.now().plusYears(100)) // Free forever
                    .autoRenew(true)
                    .build();
            
            userSubscriptionRepository.save(subscription);
            log.info("Created default STARTER subscription for user: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to create default subscription for user {}: {}", user.getEmail(), e.getMessage());
            // Don't fail the registration if subscription creation fails
        }
    }

    // ------------------ REFRESH TOKEN ------------------
    @Override
    public JwtResponse refreshToken(String oldRefreshToken) {
        if (!jwtProvider.isTokenValid(oldRefreshToken)) {
            throw new ApiException("Invalid or expired refresh token");
        }

        String email = jwtProvider.extractEmail(oldRefreshToken);
        if (email == null) throw new ApiException("Invalid token payload");

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found"));

        if (!user.isActive()) throw new ApiException("User account is disabled");

        // Verify refresh token in DB
        RefreshToken stored = refreshTokenRepository.findByToken(oldRefreshToken)
                .orElseThrow(() -> new ApiException("Refresh token not found in system"));

        if (stored.isRevoked() || stored.getExpiryDate().isBefore(Instant.now())) {
            throw new ApiException("Refresh token expired or revoked");
        }

        // Rotate refresh token
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        // Generate new tokens
        String newAccessToken = jwtProvider.generateAccessToken(email);
        String newRefreshToken = jwtProvider.generateRefreshToken(email);

        RefreshToken newEntity = RefreshToken.builder()
                .token(newRefreshToken)
                .user(user)
                .expiryDate(Instant.now().plusMillis(jwtProvider.getRefreshExpiration()))
                .revoked(false)
                .build();
        refreshTokenRepository.save(newEntity);

        long newAccessExpiry = System.currentTimeMillis() + jwtProvider.getAccessExpiration();

        log.info("Refreshed token for user {}", email);
        return new JwtResponse(newAccessToken, newAccessExpiry, newRefreshToken);
    }

    // ------------------ STATUS CHECK ------------------
    @Override
    public boolean checkUserIsActive(String email) {
        return userRepository.findByEmail(email)
                .map(User::isActive)
                .orElse(false);
    }
}
