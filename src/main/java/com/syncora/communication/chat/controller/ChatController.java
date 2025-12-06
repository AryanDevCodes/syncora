package com.syncora.communication.chat.controller;

import com.syncora.communication.chat.dto.*;
import com.syncora.communication.chat.service.ChatService;
import com.syncora.common.response.ApiResponse;
import com.syncora.security.JwtProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chatService;
    private final JwtProvider jwtProvider;

    private String extractEmail(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            throw new RuntimeException("Missing Authorization header");
        }
        String token = header.substring(7);
        return jwtProvider.extractEmail(token);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ChatRoomDto>>> list(HttpServletRequest request) {
        String email = extractEmail(request);
        return ResponseEntity
                .ok(new ApiResponse<>(true,
                        "OK",
                        chatService.listUserRooms(email)));
    }

    @GetMapping("/{roomId}/message")
    public ResponseEntity<ApiResponse<List<ChatMessageDto>>> messages(HttpServletRequest request,
            @PathVariable String roomId) {
        String email = extractEmail(request);
        return ResponseEntity.ok(new ApiResponse<>(true,
                "Message Loaded",
                chatService.getMessages(email, roomId)));
    }

    @PostMapping("/{roomId}/send")
    public ResponseEntity<ApiResponse<ChatMessageDto>> send(HttpServletRequest request, @PathVariable String roomId,
            @Valid @RequestBody MessageSendRequest body) {
        String email = extractEmail(request);

        body.setRoomId(roomId);
        return ResponseEntity.ok(new ApiResponse<>(true,
                "Sent",
                chatService.sendMessage(email, body)));
    }

    @PostMapping("/direct/{peerEmail}")
    public ResponseEntity<ApiResponse<ChatRoomDto>> createDirect(HttpServletRequest request,
            @PathVariable String peerEmail) {
        String email = extractEmail(request);
        return ResponseEntity.ok(new ApiResponse<>(true,
                "Room Created",
                chatService.createDirectRoom(email, peerEmail)));
    }

    @PostMapping("/group")
    public ResponseEntity<ApiResponse<ChatRoomDto>> createGroup(HttpServletRequest request,
            @RequestParam String name,
            @RequestBody List<String> members) {
        String email = extractEmail(request);
        return ResponseEntity.ok(new ApiResponse<>(true,
                "Group Created",
                chatService.createGroupRoom(email, name, members)));
    }

    @GetMapping("/{roomId}/search")
    public ResponseEntity<ApiResponse<List<ChatMessageDto>>> search(HttpServletRequest request,
            @PathVariable String roomId,
            @RequestParam String searchQuery) {
        String email = extractEmail(request);
        return ResponseEntity.ok(new ApiResponse<>(true,
                "Results",
                chatService.searchMessages(email, roomId, searchQuery)));
    }

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<ChatRoomDto>> createRoom(HttpServletRequest req,
            @Valid @RequestBody CreateRoomRequest body) {
        String email = extractEmail(req);
        ChatRoomDto dto = chatService.createRoom(email, body);
        return ResponseEntity.ok(new ApiResponse<>(true, "Room created successfully", dto));
    }

    @PatchMapping("/{roomId}/rename")
    public ResponseEntity<ApiResponse<Void>> renameRoom(HttpServletRequest req,
            @PathVariable String roomId,
            @RequestParam String newName) {
        String email = extractEmail(req);
        chatService.renameRoom(email, roomId, newName);
        return ResponseEntity.ok(new ApiResponse<>(true, "Room renamed successfully", null));
    }

    @PostMapping("/{roomId}/members/add")
    public ResponseEntity<ApiResponse<ChatRoomDto>> addMembers(
            HttpServletRequest req,
            @PathVariable String roomId,
            @Valid @RequestBody AddMembersRequest body) {

        String email = extractEmail(req);
        body.setRoomId(roomId);

        ChatRoomDto updatedRoom = chatService.addMembersToRoom(email, body);
        return ResponseEntity.ok(new ApiResponse<>(true, "Members added successfully", updatedRoom));
    }

    @PatchMapping("/{roomId}/mark-read")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(HttpServletRequest req, @PathVariable String roomId) {
        String email = extractEmail(req);
        chatService.markAsRead(email, roomId);
        return ResponseEntity.ok(new ApiResponse<>(true, "All messages marked as read", null));
    }

    // ✅ Get all rooms (direct + group)
    @GetMapping("/rooms")
    public ResponseEntity<ApiResponse<List<ChatRoomDto>>> getAllRooms(HttpServletRequest request) {
        String email = extractEmail(request);
        return ResponseEntity.ok(
                new ApiResponse<>(true, "All rooms fetched", chatService.listAllRooms(email)));
    }

    // ✅ Get only groups
    @GetMapping("/groups")
    public ResponseEntity<ApiResponse<List<ChatRoomDto>>> getGroups(HttpServletRequest request) {
        String email = extractEmail(request);
        return ResponseEntity.ok(
                new ApiResponse<>(true, "Group chats fetched", chatService.listGroupRooms(email)));
    }

    // ✅ Get only direct chats
    @GetMapping("/directs")
    public ResponseEntity<ApiResponse<List<ChatRoomDto>>> getDirects(HttpServletRequest request) {
        String email = extractEmail(request);
        return ResponseEntity.ok(
                new ApiResponse<>(true, "Direct chats fetched", chatService.listDirectRooms(email)));
    }

    @GetMapping("/rooms/filter")
    public ResponseEntity<ApiResponse<List<ChatRoomDto>>> filterRooms(
            HttpServletRequest request,
            @RequestParam(required = false) String type) {

        String email = extractEmail(request);
        List<ChatRoomDto> result = switch (type != null ? type.toLowerCase() : "all") {
            case "group" -> chatService.listGroupRooms(email);
            case "direct" -> chatService.listDirectRooms(email);
            default -> chatService.listAllRooms(email);
        };

        return ResponseEntity.ok(new ApiResponse<>(true, "Rooms filtered", result));
    }

    // ✅ MARK ALL AS DELIVERED
    @PatchMapping("/{roomId}/delivered")
    public ResponseEntity<ApiResponse<String>> markDelivered(HttpServletRequest req,
            @PathVariable String roomId) {
        String email = extractEmail(req);
        chatService.markDelivered(email, roomId);
        return ResponseEntity.ok(
                new ApiResponse<>(true, "All messages marked as delivered in room " + roomId, null));
    }

    // ✅ MARK ALL AS READ
    @PatchMapping("/{roomId}/read")
    public ResponseEntity<ApiResponse<String>> markAsRead(HttpServletRequest req,
            @PathVariable String roomId) {
        String email = extractEmail(req);
        chatService.markAsRead(email, roomId);
        return ResponseEntity.ok(
                new ApiResponse<>(true, "All messages marked as read in room " + roomId, null));
    }

    @DeleteMapping("/message/{messageId}")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(HttpServletRequest req,
            @PathVariable String messageId,
            @RequestParam(defaultValue = "false") boolean deleteForAll) {
        String email = extractEmail(req);
        chatService.deleteMessage(email, messageId, deleteForAll);
        String message = deleteForAll
                ? "Message deleted for everyone"
                : "Message deleted for you";
        return ResponseEntity.ok(new ApiResponse<>(true, message, null));
    }

    @DeleteMapping("/{roomId}/delete")
    public ResponseEntity<ApiResponse<String>> deleteRoom(
            HttpServletRequest request,
            @PathVariable String roomId) {

        String email = extractEmail(request);

        chatService.deleteRoom(email, roomId);

        return ResponseEntity.ok(new ApiResponse<>(true,
                "Chat room deleted successfully along with all associated data",
                roomId));
    }



}
