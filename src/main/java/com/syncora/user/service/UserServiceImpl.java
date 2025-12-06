package com.syncora.user.service;

import com.syncora.common.exception.ApiException;
import com.syncora.user.dto.UpdateUserRequest;
import com.syncora.user.dto.UserDto;
import com.syncora.user.entity.User;
import com.syncora.user.repository.UserRepository;

import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public UserDto getByEmail(@NotBlank String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User Not Found"));

        return map(user);
    }

    @Override
    public UserDto getById(@NotBlank String id) {
        Objects.requireNonNull(id, "id must not be null");
        User user = userRepository.findById(id).orElseThrow(() -> new ApiException("User Not Found"));

        return map(user);
    }

    @Override
    public UserDto updateByEmail(String email, UpdateUserRequest request) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new ApiException("User Not Found"));
        Optional.ofNullable(request.getFirstName()).ifPresent(user::setFirstName);
        Optional.ofNullable(request.getLastName()).ifPresent(user::setLastName);
        Optional.ofNullable(request.getAvatarUrl()).ifPresent(user::setAvatarUrl);
        Optional.ofNullable(request.getEmailNotifications()).ifPresent(user::setEmailNotifications);
        Optional.ofNullable(request.getPushNotifications()).ifPresent(user::setPushNotifications);
        Optional.ofNullable(request.getChatNotifications()).ifPresent(user::setChatNotifications);
        Optional.ofNullable(request.getTaskNotifications()).ifPresent(user::setTaskNotifications);
        userRepository.save(user);
        return map(user);
    }

    @Override
    public void deleteByEmail(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new ApiException("User Not Found"));
        if (user != null) {
            userRepository.delete(user);
        }
    }

    @Override
    public java.util.Map<String, Object> exportByEmail(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new ApiException("User Not Found"));
        java.util.Map<String, Object> data = new java.util.HashMap<>();
        java.util.Map<String, Object> profile = new java.util.HashMap<>();
        profile.put("id", user.getId());
        profile.put("email", user.getEmail());
        profile.put("firstName", user.getFirstName());
        profile.put("lastName", user.getLastName());
        profile.put("avatarUrl", user.getAvatarUrl());
        profile.put("role", user.getRole());
        profile.put("subscriptionPlan", user.getSubscriptionPlan());
        profile.put("storageUsedBytes", user.getStorageUsedBytes());
        profile.put("emailNotifications", user.getEmailNotifications());
        profile.put("pushNotifications", user.getPushNotifications());
        profile.put("chatNotifications", user.getChatNotifications());
        profile.put("taskNotifications", user.getTaskNotifications());

        data.put("profile", profile);
        // Placeholder for future expansion (notes, tasks, contacts, etc.)
        return data;
    }

    private UserDto map(User u) {
        UserDto dto = new UserDto();
        dto.setUserId(u.getId());
        dto.setUserEmail(u.getEmail());
        dto.setFirstName(u.getFirstName());
        dto.setLastName(u.getLastName());
        dto.setAvatarUrl(u.getAvatarUrl());
        dto.setRole(u.getRole());
        dto.setSubscriptionPlan(u.getSubscriptionPlan());
        dto.setStorageUsedBytes(u.getStorageUsedBytes());
        dto.setEmailNotifications(u.getEmailNotifications());
        dto.setPushNotifications(u.getPushNotifications());
        dto.setChatNotifications(u.getChatNotifications());
        dto.setTaskNotifications(u.getTaskNotifications());

        return dto;
    }

}
