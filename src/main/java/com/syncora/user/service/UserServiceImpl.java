package com.syncora.user.service;

import com.syncora.common.exception.ApiException;
import com.syncora.user.dto.UpdateUserRequest;
import com.syncora.user.dto.UserDto;
import com.syncora.user.entity.User;
import com.syncora.user.repository.UserRepository;
import com.syncora.note.repository.NoteRepository;
import com.syncora.task.repository.TaskRepository;
import com.syncora.contact.repository.ContactRepository;
import com.syncora.security.repository.RefreshTokenRepository;
import com.syncora.communication.chat.repository.MessageRepository;
import com.syncora.communication.chat.repository.ChatRoomRepository;
import com.syncora.subscription.repository.UserSubscriptionRepository;
import com.syncora.video.repository.VideoCallHistoryRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final NoteRepository noteRepository;
    private final TaskRepository taskRepository;
    private final ContactRepository contactRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final MessageRepository messageRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final VideoCallHistoryRepository videoCallHistoryRepository;
    
    @PersistenceContext
    private EntityManager entityManager;

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
        Optional.ofNullable(request.getBio()).ifPresent(user::setBio);
        Optional.ofNullable(request.getEmailNotifications()).ifPresent(user::setEmailNotifications);
        Optional.ofNullable(request.getPushNotifications()).ifPresent(user::setPushNotifications);
        Optional.ofNullable(request.getChatNotifications()).ifPresent(user::setChatNotifications);
        Optional.ofNullable(request.getTaskNotifications()).ifPresent(user::setTaskNotifications);
        userRepository.save(user);
        return map(user);
    }

    @Override
    @Transactional
    public void deleteByEmail(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new ApiException("User Not Found"));
        
        log.info("Deleting user account and all related data for: {}", email);
        
        try {

            refreshTokenRepository.deleteAllByUser(user);
            entityManager.flush();
            log.info("Deleted refresh tokens for user: {}", email);
            
            noteRepository.deleteAllByOwner(user);
            entityManager.flush();
            log.info("Deleted notes for user: {}", email);
            
            taskRepository.deleteAllByOwner(user);
            entityManager.flush();
            log.info("Deleted tasks for user: {}", email);
            
            contactRepository.deleteAllByOwner(user);
            entityManager.flush();
            log.info("Deleted contacts for user: {}", email);
            
            messageRepository.deleteAllBySenderEmail(email);
            entityManager.flush();
            log.info("Deleted messages for user: {}", email);

            var memberRoomIds = chatRoomRepository.findIdsByMemberEmail(email);
            if (!memberRoomIds.isEmpty()) {
                chatRoomRepository.deleteAllMembershipsByEmail(email);
                entityManager.flush();
                log.info("Removed memberships from {} rooms for user: {}", memberRoomIds.size(), email);
            }

            var ownedRooms = chatRoomRepository.findAllByOwnerId(user.getId());
            if (!ownedRooms.isEmpty()) {
                var roomIds = ownedRooms.stream().map(r -> r.getId()).toList();
                messageRepository.deleteAllByRoomIdIn(roomIds);
                entityManager.flush();
                chatRoomRepository.deleteAllByOwnerId(user.getId());
                entityManager.flush();
                log.info("Deleted owned chat rooms ({}) and their messages for user: {}", roomIds.size(), email);
            }
            
            // 7. Delete video call history
            videoCallHistoryRepository.deleteAllByUser(user);
            entityManager.flush();
            log.info("Deleted video call history for user: {}", email);
            
            // 8. Delete subscription data
            userSubscriptionRepository.deleteAllByUser(user);
            entityManager.flush();
            log.info("Deleted subscription data for user: {}", email);
            
            // 9. Finally, delete the user
            userRepository.delete(user);
            entityManager.flush();
            log.info("Successfully deleted user account: {}", email);
            
        } catch (Exception e) {
            log.error("Error deleting user data for: {}", email, e);
            throw new ApiException("Failed to delete user account: " + e.getMessage());
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
        profile.put("bio", user.getBio());
        profile.put("role", user.getRole());
        profile.put("subscriptionPlan", user.getSubscriptionPlan());
        profile.put("storageUsedBytes", user.getStorageUsedBytes());
        profile.put("emailNotifications", user.getEmailNotifications());
        profile.put("pushNotifications", user.getPushNotifications());
        profile.put("chatNotifications", user.getChatNotifications());
        profile.put("taskNotifications", user.getTaskNotifications());

        data.put("profile", profile);
        return data;
    }

    private UserDto map(User u) {
        UserDto dto = new UserDto();
        dto.setUserId(u.getId());
        dto.setUserEmail(u.getEmail());
        dto.setFirstName(u.getFirstName());
        dto.setLastName(u.getLastName());
        dto.setAvatarUrl(u.getAvatarUrl());
        dto.setBio(u.getBio());
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
