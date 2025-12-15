package com.syncora.security.oauth2;

import com.syncora.common.exception.ApiException;
import com.syncora.communication.video.utils.TokenUtils;
import com.syncora.user.entity.User;
import com.syncora.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final TokenUtils tokenUtils;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        log.info("Starting OAuth2 login for provider: {}", userRequest.getClientRegistration().getRegistrationId());
        log.info("Client ID: {}", userRequest.getClientRegistration().getClientId());
        log.info("Redirect URI: {}", userRequest.getClientRegistration().getRedirectUri());
        OAuth2User oauth2User = super.loadUser(userRequest);

        try {
            log.info("OAuth2 user attributes: {}", oauth2User.getAttributes());
            return processOAuth2User(userRequest, oauth2User);
        } catch (Exception ex) {
            log.error("Error processing OAuth2 user", ex);
            throw new OAuth2AuthenticationException(ex.getMessage());
        }
    }

    private OAuth2User processOAuth2User(OAuth2UserRequest userRequest, OAuth2User oauth2User) {
    String registrationId = userRequest.getClientRegistration().getRegistrationId();
    OAuth2UserInfo userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(registrationId, oauth2User.getAttributes());

    log.info("Extracted user info: email={}, id={}, profileUrl={}", userInfo.getEmail(), userInfo.getId(), userInfo.getProfileUrl());

    if (userInfo.getEmail() == null || userInfo.getEmail().isEmpty()) {
        log.error("Email not found from OAuth2 provider: {}", registrationId);
        throw new ApiException("Email not found from OAuth2 provider");
    }

    User user = userRepository.findByEmail(userInfo.getEmail())
        .map(existingUser -> updateExistingUser(existingUser, userInfo, registrationId))
        .orElseGet(() -> registerNewUser(userInfo, registrationId));

    log.info("User entity after OAuth2 processing: {}", user);
    return new CustomOAuth2User(oauth2User, user);
    }

    private User registerNewUser(OAuth2UserInfo userInfo, String provider) {
        log.info("Registering new user from OAuth2: {} ({})", userInfo.getEmail(), provider);

    User user = User.builder()
                .email(userInfo.getEmail())
                .passwordHash("")
                .firstName(userInfo.getFirstName())
                .lastName(userInfo.getLastName())
                .avatarUrl(userInfo.getImageUrl())
                .provider(provider.toUpperCase())
                .providerId(userInfo.getId())
                .providerProfileUrl(userInfo.getProfileUrl())
                .isActive(true)
                .role("ROLE_USER")
                .emailNotifications(true)
                .pushNotifications(true)
                .chatNotifications(true)
                .taskNotifications(true)
                .storageUsedBytes(0L)
                .build();

        user = userRepository.save(user);
        log.info("Created new OAuth2 user: {} ({})", user.getId() != null ? user.getId() : "null", user.getEmail() != null ? user.getEmail() : "null");

        return user;
    }

    private User updateExistingUser(User existingUser, OAuth2UserInfo userInfo, String provider) {
        log.info("Updating existing user from OAuth2: {} ({})", userInfo.getEmail(), provider);

        // Update user info if changed
        existingUser.setFirstName(userInfo.getFirstName());
        existingUser.setLastName(userInfo.getLastName());
        if (userInfo.getImageUrl() != null) {
            existingUser.setAvatarUrl(userInfo.getImageUrl());
        }
        existingUser.setProvider(provider.toUpperCase());
        existingUser.setProviderId(userInfo.getId());
        if (userInfo.getProfileUrl() != null) {
            existingUser.setProviderProfileUrl(userInfo.getProfileUrl());
        }

        return userRepository.save(existingUser);
    }
}
