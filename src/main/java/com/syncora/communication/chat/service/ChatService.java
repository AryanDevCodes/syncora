package com.syncora.communication.chat.service;


import com.syncora.communication.chat.dto.*;

import java.util.List;

public interface ChatService {
    
    ChatRoomDto createDirectRoom(String userEmail, String peerEmail);

    ChatRoomDto createGroupRoom(String ownerEmail, String name, List<String> members);

    List<ChatRoomDto> listUserRooms(String userEmail);

    List<ChatMessageDto> getMessages(String userEmail, String roomId);

    ChatMessageDto sendMessage(String userEmail, MessageSendRequest request);

    void markAsRead(String userEmail, String roomId);

    List<ChatMessageDto> searchMessages(String userEmail, String roomId, String query);

    ChatRoomDto createRoom(String ownerEmail, CreateRoomRequest request);

    void renameRoom(String userEmail, String roomId, String newName);

    ChatRoomDto addMembersToRoom(String userEmail, AddMembersRequest request);

    List<ChatRoomDto> listAllRooms(String userEmail);

    List<ChatRoomDto> listGroupRooms(String userEmail);

    List<ChatRoomDto> listDirectRooms(String userEmail);

    ChatRoomDto getRoomById(String userEmail, String roomId);

    void markDelivered(String userEmail, String roomId);

    void deleteMessage(String userEmail, String messageId, boolean deleteForAll);

    void deleteRoom(String requesterEmail, String roomId);



}