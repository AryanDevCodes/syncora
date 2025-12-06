package com.syncora.user.controller;

import com.syncora.common.response.ApiResponse;
import com.syncora.security.JwtProvider;
import com.syncora.user.service.UserService;
import com.syncora.user.dto.UpdateUserRequest;
import com.syncora.user.dto.UserDto;
import com.syncora.user.entity.User;
import com.syncora.user.repository.UserRepository;
import com.syncora.note.service.NoteService;
import com.syncora.task.service.TaskService;
import com.syncora.contact.service.ContactService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/users")
@AllArgsConstructor
public class UserController {

    private final UserService userService;
    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;
    private final NoteService noteService;
    private final TaskService taskService;
    private final ContactService contactService;

    private String extractEmail(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            String email = jwtProvider.extractEmail(token);
            if (email == null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token");
            }
            return email;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing or invalid Authorization header");
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getMe(HttpServletRequest request) {
        String email = extractEmail(request);
        UserDto dto = userService.getByEmail(email);
        return ResponseEntity.ok(new ApiResponse<>(true, "OK", dto));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> updateMe(HttpServletRequest request,
                                                         @Valid @RequestBody UpdateUserRequest req) {
        String email = extractEmail(request);
        UserDto dto = userService.updateByEmail(email, req);
        return ResponseEntity.ok(new ApiResponse<>(true, "Profile updated", dto));
    }

    @GetMapping("/me/export")
    public ResponseEntity<byte[]> exportMe(HttpServletRequest request) {
        String email = extractEmail(request);
        var export = userService.exportByEmail(email);
        // Enrich export with notes, tasks, contacts
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User Not Found"));
        try {
            export.put("notes", noteService.getAllNotes(user));
        } catch (Exception ignored) {}
        try {
            export.put("tasks", taskService.getAllTasks(user));
        } catch (Exception ignored) {}
        try {
            export.put("contacts", contactService.getAllContacts(email));
        } catch (Exception ignored) {}
        try {
            ObjectMapper mapper = new ObjectMapper();
            byte[] jsonBytes = mapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(export);

            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String filename = ("syncora_export_" + timestamp + ".json");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
            headers.set(HttpHeaders.CONTENT_LENGTH, String.valueOf(jsonBytes.length));

            return new ResponseEntity<>(jsonBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to export data");
        }
    }

    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> deleteMe(HttpServletRequest request) {
        String email = extractEmail(request);
        userService.deleteByEmail(email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Account deleted", null));
    }

    @GetMapping("/by-email/{email}")
    public ResponseEntity<ApiResponse<UserDto>> getByEmailPath(@PathVariable String email) {
        UserDto dto = userService.getByEmail(email);
        return ResponseEntity.ok(new ApiResponse<>(true, "OK", dto));
    }

    @GetMapping("/by-email")
    public ResponseEntity<ApiResponse<UserDto>> getByEmailQuery(@RequestParam String email) {
        UserDto dto = userService.getByEmail(email);
        return ResponseEntity.ok(new ApiResponse<>(true, "OK", dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> getById(@PathVariable String id) {
        UserDto dto = userService.getById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "OK", dto));
    }
}
