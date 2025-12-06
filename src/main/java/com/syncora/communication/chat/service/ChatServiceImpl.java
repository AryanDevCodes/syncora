package com.syncora.communication.chat.service;

import com.syncora.communication.chat.dto.*;
import com.syncora.communication.chat.entity.ChatRoom;
import com.syncora.communication.chat.entity.Message;
import com.syncora.communication.chat.repository.ChatRoomRepository;
import com.syncora.communication.chat.repository.MessageRepository;
import com.syncora.communication.ably.AblyTokenService;
import com.syncora.common.exception.ApiException;
import com.syncora.contact.repository.ContactRepository;
import com.syncora.user.entity.User;
import com.syncora.user.repository.UserRepository;
import com.syncora.communication.video.repository.VideoRoomRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.annotation.Lazy;
import org.springframework.beans.factory.annotation.Autowired;


import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ChatServiceImpl implements ChatService {

    private final VideoRoomRepository videoRoomRepository;

    private final ChatRoomRepository roomRepo;
    private final MessageRepository messageRepo;
    private final UserRepository userRepo;
    private final ContactRepository contactRepository;
    private final AblyTokenService ablyTokenService;
    
    @Autowired(required = false)
    @Lazy
    private SimpMessagingTemplate simpMessagingTemplate;

    // ✅ Create Direct Chat Room
    @Override
    @Transactional
    public ChatRoomDto createDirectRoom(String userEmail, String peerEmail) {
        Optional<ChatRoom> existing = roomRepo.findDirectRoomBetween(userEmail, peerEmail);

        if (existing.isPresent())
            return mapRoom(Objects.requireNonNull(existing.get()), userEmail);

        User owner = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new ApiException("User not found"));

        ChatRoom room = ChatRoom.builder()
                .owner(owner)
                .memberEmails(List.of(userEmail, peerEmail))
                .isGroup(false)
                .build();

        roomRepo.save(Objects.requireNonNull(room));
        return mapRoom(room, userEmail);
    }

    @Override
    @Transactional
    public ChatRoomDto createGroupRoom(String ownerEmail, String name, List<String> members) {
        User owner = userRepo.findByEmail(ownerEmail)
                .orElseThrow(() -> new ApiException("Owner not found"));

        // ✅ unique emails only
        Set<String> allMembers = new HashSet<>(members);
        allMembers.add(ownerEmail);

        List<ChatRoom> existingRooms = roomRepo.findGroupRoomsForUser(ownerEmail);
        for (ChatRoom g : existingRooms) {
            Set<String> existingMembers = new HashSet<>(g.getMemberEmails());
            if (existingMembers.equals(allMembers)) {
                return mapRoom(g, ownerEmail);
            }
        }
        ChatRoom room = ChatRoom.builder()
                .owner(owner)
                .name(name)
                .memberEmails(new ArrayList<>(allMembers))
                .isGroup(true)
                .build();

        roomRepo.save(Objects.requireNonNull(room));
        return mapRoom(room, ownerEmail);
    }

    // ✅ Unified Room Creation
    @Override
    @Transactional
    public ChatRoomDto createRoom(String ownerEmail, CreateRoomRequest request) {
        if (request.isGroup()) {
            if (request.getName() == null || request.getName().isBlank())
                throw new ApiException("Group name is required");
            if (request.getMemberEmails() == null || request.getMemberEmails().isEmpty())
                throw new ApiException("At least one member required for group chat");
            return createGroupRoom(ownerEmail, request.getName(), request.getMemberEmails());
        } else {
            if (request.getMemberEmails() == null || request.getMemberEmails().isEmpty())
                throw new ApiException("Member email is required for direct chat");
            return createDirectRoom(ownerEmail, request.getMemberEmails().get(0));
        }
    }

    // ✅ List User Rooms
    @Override
    @Transactional(readOnly = true)
    public List<ChatRoomDto> listUserRooms(String userEmail) {
        return roomRepo.findVisibleRoomsForUser(userEmail)
                .stream()
                .map(room -> {
                    ChatRoomDto dto = mapRoom(room, userEmail);
                    messageRepo.findTopByRoomIdOrderBySentAtDesc(room.getId())
                            .ifPresent(m -> dto.setLastMessagePreview(m.getContent()));
                    dto.setUnreadCount(messageRepo.countUnread(room.getId(), userEmail));
                    return dto;
                })
                .sorted(Comparator.comparing(ChatRoomDto::getLastMessageTime,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    @Override
    @Transactional
    public List<ChatMessageDto> getMessages(String userEmail, String roomId) {
        roomRepo.findByIdAndMemberEmailsContaining(roomId, userEmail)
                .orElseThrow(() -> new ApiException("Access denied or room not found"));

        int deliveredCount = messageRepo.markAllDelivered(roomId, userEmail);
        if (deliveredCount > 0)
            log.info("📬 {} messages marked as delivered for {}", deliveredCount, userEmail);

        return messageRepo.findByRoomIdOrderBySentAtAsc(roomId)
                .stream()
                .map(this::mapMsg)
                .toList();
    }

    @Override
    @Transactional
    public ChatMessageDto sendMessage(String userEmail, MessageSendRequest request) {
        ChatRoom room = roomRepo.findByIdAndMemberEmailsContaining(request.getRoomId(), userEmail)
                .orElseThrow(() -> new ApiException("Access denied or room not found"));

        String messageType = "TEXT";
        if (request.getFileId() != null) {
            messageType = "FILE";
        } else if (request.getAttachmentUrl() != null) {
            messageType = "IMAGE";
        }

        Message msg = Message.builder()
                .roomId(room.getId())
                .senderEmail(userEmail)
                .content(request.getContent())
                .attachmentUrl(request.getAttachmentUrl())
                .type(messageType)
                .fileId(request.getFileId())
                .fileName(request.getFileName())
                .fileSize(request.getFileSize())
                .fileType(request.getFileType())
                .sentAt(LocalDateTime.now())
                .delivered(true)
                .deliveredAt(LocalDateTime.now())
                .read(false)
                .readAt(LocalDateTime.now())
                .build();

        messageRepo.save(Objects.requireNonNull(msg));
        
        ablyTokenService.publishMessage(
            msg.getRoomId(),
            msg.getId(),
            msg.getContent(),
            msg.getSenderEmail(),
            msg.getSentAt().toInstant(ZoneOffset.UTC).toEpochMilli(),
            "sent",
            msg.getType()  // TEXT, IMAGE, FILE, etc.
        );
        
        return mapMsg(msg);
    }

    // ✅ Search Messages
    @Override
    @Transactional(readOnly = true)
    public List<ChatMessageDto> searchMessages(String userEmail, String roomId, String query) {
        roomRepo.findByIdAndMemberEmailsContaining(roomId, userEmail)
                .orElseThrow(() -> new ApiException("Access denied"));
        return messageRepo.searchMessages(roomId, query)
                .stream().map(this::mapMsg).toList();
    }

    // ✅ Rename Group Room (role-based)
    @Override
    @Transactional
    public void renameRoom(String userEmail, String roomId, String newName) {
        ChatRoom room = roomRepo.findById(Objects.requireNonNull(roomId))
                .orElseThrow(() -> new ApiException("Room not found"));

        if (!room.isGroup())
            throw new ApiException("Only group chats can be renamed");

        if (!room.getOwner().getEmail().equalsIgnoreCase(userEmail))
            throw new ApiException("Only the owner can rename this group");

        room.setName(newName);
        roomRepo.save(room);
    }

    @Override
    @Transactional
    public ChatRoomDto addMembersToRoom(String userEmail, AddMembersRequest request) {
        ChatRoom room = roomRepo.findById(Objects.requireNonNull(request.getRoomId()))
                .orElseThrow(() -> new ApiException("Room not found"));

        User owner = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new ApiException("User not found"));

        // ✅ Fetch all contact emails of this user
        List<String> contactEmails = contactRepository.findEmailsByOwnerEmail(userEmail);

        // ✅ Validate all requested members
        List<String> invalidMembers = new ArrayList<>();

        for (String member : request.getNewMembers()) {
            if (!contactEmails.contains(member)) {
                log.warn("⚠️ Member not in contacts: {}", member);
                invalidMembers.add(member);
            }
        }

        if (!invalidMembers.isEmpty()) {
            throw new ApiException("Cannot add members: " + String.join(", ", invalidMembers));
        }

        // ✅ Case 1: Group chat — just add new members
        if (room.isGroup()) {
            if (!room.getOwner().getEmail().equalsIgnoreCase(userEmail)) {
                throw new ApiException("Only group owner can add members");
            }

            List<String> updated = new ArrayList<>(room.getMemberEmails());
            for (String m : request.getNewMembers()) {
                if (!updated.contains(m))
                    updated.add(m);
            }
            room.setMemberEmails(updated);
            roomRepo.save(room);
            return mapRoom(room, userEmail);
        }

        // ✅ Case 2: Direct chat — create new group (all members + new)
        List<String> allMembers = new ArrayList<>(room.getMemberEmails());
        for (String m : request.getNewMembers()) {
            if (!allMembers.contains(m))
                allMembers.add(m);
        }

        ChatRoom newGroup = ChatRoom.builder()
                .owner(owner)
                .isGroup(true)
                .name(generateGroupName(allMembers))
                .memberEmails(allMembers)
                .createdAt(LocalDateTime.now())
                .build();

        roomRepo.save(Objects.requireNonNull(newGroup));
        return mapRoom(newGroup, userEmail);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatRoomDto> listAllRooms(String userEmail) {
        return enrichRooms(roomRepo.findVisibleRoomsForUser(userEmail), userEmail);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatRoomDto> listGroupRooms(String userEmail) {
        return enrichRooms(roomRepo.findGroupRoomsForUser(userEmail), userEmail);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatRoomDto> listDirectRooms(String userEmail) {
        return enrichRooms(roomRepo.findDirectRoomsForUser(userEmail), userEmail);
    }

    /**
     * Common enrichment logic for any room list.
     */
    private List<ChatRoomDto> enrichRooms(List<ChatRoom> rooms, String userEmail) {
        return rooms.stream()
                .map(room -> {
                    ChatRoomDto dto = mapRoom(room, userEmail);

                    // 🔹 Add unread count
                    dto.setUnreadCount(messageRepo.countUnread(room.getId(), userEmail));

                    // 🔹 Add last message preview and time
                    messageRepo.findTopByRoomIdOrderBySentAtDesc(room.getId())
                            .ifPresent(last -> {
                                dto.setLastMessagePreview(last.getContent());
                                dto.setLastMessageTime(last.getSentAt());
                            });

                    return dto;
                })
                .sorted((r1, r2) -> {
                    // 🔹 Sort by most recent message first
                    if (r1.getLastMessageTime() == null)
                        return 1;
                    if (r2.getLastMessageTime() == null)
                        return -1;
                    return r2.getLastMessageTime().compareTo(r1.getLastMessageTime());
                })
                .toList();
    }

    private String generateGroupName(List<String> members) {
        if (members == null || members.isEmpty()) {
            return "New Group";
        }

        // Remove duplicate emails for safety
        List<String> unique = members.stream().distinct().toList();

        if (unique.size() == 1) {
            return unique.get(0);
        } else if (unique.size() == 2) {
            return unique.get(0) + " & " + unique.get(1);
        } else {
            return unique.get(0) + " + " + unique.get(1) + " + " + (unique.size() - 2) + " others";
        }
    }

    // ✅ Mapper — Converts Message to DTO
    private ChatMessageDto mapMsg(Message m) {
        return ChatMessageDto.builder()
                .id(m.getId())
                .roomId(m.getRoomId())
                .senderEmail(m.getSenderEmail())
                .content(m.getContent())
                .attachmentUrl(m.getAttachmentUrl())
                .type(m.getType())
                .sentAt(m.getSentAt())
                .delivered(m.isDelivered())
                .deliveredAt(m.getDeliveredAt())
                .read(m.isRead())
                .readAt(m.getReadAt())
                .fileId(m.getFileId())
                .fileName(m.getFileName())
                .fileSize(m.getFileSize())
                .fileType(m.getFileType())
                .build();
    }

    // ✅ Mapper — Context-Aware Room Mapping
    private ChatRoomDto mapRoom(ChatRoom room, String userEmail) {
        ChatRoomDto dto = new ChatRoomDto();
        dto.setId(room.getId());
        dto.setGroup(room.isGroup());
        dto.setMemberEmails(room.getMemberEmails());
        dto.setOwnerEmail(room.getOwner().getEmail());
        dto.setCreatedAt(room.getCreatedAt());

        // Unread count
        dto.setUnreadCount(messageRepo.countUnread(room.getId(), userEmail));

        // Direct or group chat display name
        if (room.isGroup()) {
            dto.setName(room.getName());
        } else {
            String peerEmail = room.getMemberEmails()
                    .stream()
                    .filter(e -> !e.equalsIgnoreCase(userEmail))
                    .findFirst()
                    .orElse("Unknown");
            dto.setName(peerEmail);
        }

        // Role-based permissions
        dto.setCanRename(room.isGroup() && room.getOwner().getEmail().equalsIgnoreCase(userEmail));
        dto.setCanDelete(room.getOwner().getEmail().equalsIgnoreCase(userEmail));

        // Visibility
        dto.setVisible(!room.isGroup() || room.getMemberEmails().contains(userEmail));

        // Last message preview
        messageRepo.findTopByRoomIdOrderBySentAtDesc(room.getId())
                .ifPresent(m -> {
                    dto.setLastMessagePreview(m.getContent());
                    dto.setLastMessageTime(m.getSentAt());
                });

        return dto;
    }

    @Override
    @Transactional
    public void deleteMessage(String userEmail, String messageId, boolean deleteForAll) {
        Message message = messageRepo.findById(Objects.requireNonNull(messageId))
                .orElseThrow(() -> new ApiException("Message not found"));

        // Permission check
        if (!message.getSenderEmail().equalsIgnoreCase(userEmail) && !deleteForAll) {
            throw new ApiException("You can delete only your own messages");
        }

        // Perform soft delete
        int updated;
        if (deleteForAll) {
            updated = messageRepo.deleteForAll(messageId);
        } else {
            updated = messageRepo.deleteForSender(messageId, userEmail);
        }

        if (updated == 0)
            throw new ApiException("Message could not be deleted");

        // System message: record deletion in room timeline
        Message systemMsg = Message.builder()
                .roomId(message.getRoomId())
                .senderEmail("system@syncora.com")
                .content(deleteForAll
                        ? userEmail + " deleted a message for everyone."
                        : userEmail + " deleted their message.")
                .type("SYSTEM")
                .sentAt(LocalDateTime.now())
                .delivered(true)
                .deliveredAt(LocalDateTime.now())
                .read(false)
                .build();

        messageRepo.save(Objects.requireNonNull(systemMsg));

        // Convert to DTO for broadcasting
        ChatMessageDto systemDto = ChatMessageDto.builder()
                .id(systemMsg.getId())
                .roomId(systemMsg.getRoomId())
                .senderEmail(systemMsg.getSenderEmail())
                .content(systemMsg.getContent())
                .type(systemMsg.getType())
                .sentAt(systemMsg.getSentAt())
                .delivered(true)
                .deliveredAt(systemMsg.getDeliveredAt())
                .read(false)
                .build();

        // 🟢 Broadcast event via WebSocket (if available)
        if (simpMessagingTemplate != null) {
            simpMessagingTemplate.convertAndSend("/topic/room/" + message.getRoomId(),
                    Objects.requireNonNull(systemDto));

            // 🟢 Also broadcast a deletion marker to update UIs
            Map<String, Object> deleteEvent = Map.of(
                    "action", "MESSAGE_DELETED",
                    "roomId", message.getRoomId(),
                    "messageId", message.getId(),
                    "deletedBy", userEmail,
                    "deleteForAll", deleteForAll,
                    "timestamp", LocalDateTime.now());

            simpMessagingTemplate.convertAndSend("/topic/status/" + message.getRoomId(),
                    Objects.requireNonNull(deleteEvent));
        } else {
            log.warn("⚠️ WebSocket not available for broadcasting message deletion");
        }
    }

    @Transactional(readOnly = true)
    @Override
    public ChatRoomDto getRoomById(String userEmail, String roomId) {
        ChatRoom room = roomRepo.findByIdAndMemberEmailsContaining(roomId, userEmail)
                .orElseThrow(() -> new ApiException("Room not found or access denied"));
        return mapRoom(room, userEmail);
    }

    @Override
    @Transactional
    public void markDelivered(String userEmail, String roomId) {
        roomRepo.findByIdAndMemberEmailsContaining(roomId, userEmail)
                .orElseThrow(() -> new ApiException("Access denied or room not found"));

        int updated = messageRepo.markAllDelivered(roomId, userEmail);
        if (updated > 0)
            System.out.println("✅ " + updated + " messages marked as delivered for " + userEmail);
    }

    @Override
    @Transactional
    public void markAsRead(String userEmail, String roomId) {
        roomRepo.findByIdAndMemberEmailsContaining(roomId, userEmail)
                .orElseThrow(() -> new ApiException("Access denied or room not found"));

        int updated = messageRepo.markAllRead(roomId, userEmail);
        if (updated > 0)
            log.info("📖 {} messages marked as read for {}", updated, userEmail);
    }

    @Override
    public void deleteRoom(String email, String roomId) {
        // 1️⃣ Validate that room exists
        ChatRoom room = roomRepo.findById(roomId)
                .orElseThrow(() -> new ApiException("Chat room not found"));

        // 2️⃣ Only the owner can delete
        if (!room.getOwner().getEmail().equalsIgnoreCase(email)) {
            throw new ApiException("Only the room owner can delete this chat");
        }

        // 3️⃣ Mark chat room as deleted (soft delete)
        room.setDeleted(true);
        roomRepo.save(room);

        // 4️⃣ Delete all messages from this room
        messageRepo.deleteAllByRoomId(roomId);

        // 5️⃣ Delete all members from chat_room_members (element collection)
        roomRepo.deleteAllMembersByRoomId(roomId);

        // 6️⃣ End any active video sessions
        videoRoomRepository.findByChatRoom_IdAndEndedAtIsNull(roomId)
                .ifPresent(activeVideo -> {
                    activeVideo.setEndedAt(LocalDateTime.now());
                    activeVideo.setEndedBy(email);
                    videoRoomRepository.save(activeVideo);
                });

        // 7️⃣ Optionally, permanently remove the room record (hard delete)
        roomRepo.deleteById(roomId);

        // 8️⃣ Log and notify
        log.info("🗑️ Chat room [{}] deleted by {}", roomId, email);
    }


    
}
