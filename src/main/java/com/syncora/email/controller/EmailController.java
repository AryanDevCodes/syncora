package com.syncora.email.controller;

import com.syncora.common.response.ApiResponse;
import com.syncora.email.dto.EmailComposeRequest;
import com.syncora.email.dto.EmailDto;
import com.syncora.email.service.EmailService;
import com.syncora.security.JwtProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/emails")
@RequiredArgsConstructor
public class EmailController {
    
    private final EmailService emailService;
    private final JwtProvider jwtProvider;
    
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
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<EmailDto>>> getEmails(
            HttpServletRequest request,
            @RequestParam(required = false) String folder,
            @RequestParam(required = false) Boolean isRead,
            @RequestParam(required = false) Boolean isStarred,
            @RequestParam(required = false) String search) {
        
        String ownerEmail = extractEmail(request);
        List<EmailDto> emails = emailService.getEmails(ownerEmail, folder, isRead, isStarred, search);
        return ResponseEntity.ok(new ApiResponse<>(true, "OK", emails));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EmailDto>> getEmail(
            HttpServletRequest request,
            @PathVariable String id) {
        
        String ownerEmail = extractEmail(request);
        EmailDto email = emailService.getEmail(id, ownerEmail);
        return ResponseEntity.ok(new ApiResponse<>(true, "OK", email));
    }
    
    @PostMapping("/send")
    public ResponseEntity<ApiResponse<EmailDto>> sendEmail(
            HttpServletRequest request,
            @Valid @RequestBody EmailComposeRequest emailRequest) {
        
        String senderEmail = extractEmail(request);
        EmailDto email = emailService.sendEmail(senderEmail, emailRequest);
        return ResponseEntity.ok(new ApiResponse<>(true, "Email sent successfully", email));
    }
    
    @PostMapping("/drafts")
    public ResponseEntity<ApiResponse<EmailDto>> saveDraft(
            HttpServletRequest request,
            @Valid @RequestBody EmailComposeRequest emailRequest) {
        
        String ownerEmail = extractEmail(request);
        EmailDto email = emailService.saveDraft(ownerEmail, emailRequest);
        return ResponseEntity.ok(new ApiResponse<>(true, "Draft saved successfully", email));
    }
    
    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            HttpServletRequest request,
            @PathVariable String id,
            @RequestBody Map<String, Boolean> payload) {
        
        String ownerEmail = extractEmail(request);
        Boolean isRead = payload.get("isRead");
        emailService.markAsRead(id, ownerEmail, isRead);
        return ResponseEntity.ok(new ApiResponse<>(true, "Email updated", null));
    }
    
    @PatchMapping("/{id}/star")
    public ResponseEntity<ApiResponse<Void>> toggleStar(
            HttpServletRequest request,
            @PathVariable String id) {
        
        String ownerEmail = extractEmail(request);
        emailService.toggleStar(id, ownerEmail);
        return ResponseEntity.ok(new ApiResponse<>(true, "Email starred/unstarred", null));
    }
    
    @PatchMapping("/{id}/folder")
    public ResponseEntity<ApiResponse<Void>> moveToFolder(
            HttpServletRequest request,
            @PathVariable String id,
            @RequestBody Map<String, String> payload) {
        
        String ownerEmail = extractEmail(request);
        String folder = payload.get("folder");
        emailService.moveToFolder(id, ownerEmail, folder);
        return ResponseEntity.ok(new ApiResponse<>(true, "Email moved", null));
    }
    
    @PostMapping("/bulk/read")
    public ResponseEntity<ApiResponse<Void>> bulkMarkAsRead(
            HttpServletRequest request,
            @RequestBody Map<String, Object> payload) {
        
        String ownerEmail = extractEmail(request);
        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) payload.get("ids");
        Boolean isRead = (Boolean) payload.get("isRead");
        emailService.bulkMarkAsRead(ownerEmail, ids, isRead);
        return ResponseEntity.ok(new ApiResponse<>(true, "Emails updated", null));
    }
    
    @PostMapping("/bulk/move")
    public ResponseEntity<ApiResponse<Void>> bulkMoveToFolder(
            HttpServletRequest request,
            @RequestBody Map<String, Object> payload) {
        
        String ownerEmail = extractEmail(request);
        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) payload.get("ids");
        String folder = (String) payload.get("folder");
        emailService.bulkMoveToFolder(ownerEmail, ids, folder);
        return ResponseEntity.ok(new ApiResponse<>(true, "Emails moved", null));
    }
    
    @PostMapping("/bulk/delete")
    public ResponseEntity<ApiResponse<Void>> bulkDelete(
            HttpServletRequest request,
            @RequestBody Map<String, Object> payload) {
        
        String ownerEmail = extractEmail(request);
        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) payload.get("ids");
        emailService.bulkDelete(ownerEmail, ids);
        return ResponseEntity.ok(new ApiResponse<>(true, "Emails deleted", null));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEmail(
            HttpServletRequest request,
            @PathVariable String id) {
        
        String ownerEmail = extractEmail(request);
        emailService.deleteEmail(id, ownerEmail);
        return ResponseEntity.ok(new ApiResponse<>(true, "Email deleted", null));
    }
    
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<EmailDto>>> searchEmails(
            HttpServletRequest request,
            @RequestParam String q) {
        
        String ownerEmail = extractEmail(request);
        List<EmailDto> emails = emailService.getEmails(ownerEmail, null, null, null, q);
        return ResponseEntity.ok(new ApiResponse<>(true, "OK", emails));
    }
    
    @GetMapping("/counts")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getEmailCounts(HttpServletRequest request) {
        String ownerEmail = extractEmail(request);
        Map<String, Long> counts = emailService.getEmailCounts(ownerEmail);
        return ResponseEntity.ok(new ApiResponse<>(true, "OK", counts));
    }
    
    @GetMapping("/debug/all")
    public ResponseEntity<ApiResponse<List<EmailDto>>> getAllEmailsDebug(HttpServletRequest request) {
        String ownerEmail = extractEmail(request);
        List<EmailDto> emails = emailService.getAllEmailsForDebug(ownerEmail);
        return ResponseEntity.ok(new ApiResponse<>(true, "Debug: All emails", emails));
    }
}
