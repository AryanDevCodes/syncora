package com.syncora.contact.controller;

import com.syncora.common.response.ApiResponse;
import com.syncora.contact.dto.*;
import com.syncora.contact.service.ContactService;
import com.syncora.security.JwtProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;
    private final JwtProvider jwtProvider;

    private String extractEmail(HttpServletRequest req) {
        String token = req.getHeader("Authorization");
        if (token != null && token.startsWith("Bearer ")) token = token.substring(7);
        return jwtProvider.extractEmail(token);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ContactDto>>> getAll(HttpServletRequest req) {
        String email = extractEmail(req);
        List<ContactDto> contacts = contactService.getAllContacts(email);
        return ResponseEntity.ok(new ApiResponse<>(true, "All contacts fetched", contacts));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ContactDto>> getById(HttpServletRequest req, @PathVariable String id) {
        String email = extractEmail(req);
        ContactDto dto = contactService.getById(email, id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Contact fetched", dto));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ContactDto>> create(HttpServletRequest req,
                                                          @Valid @RequestBody ContactCreateRequest body) {
        String email = extractEmail(req);
        ContactDto dto = contactService.createContact(email, body);
        return ResponseEntity.ok(new ApiResponse<>(true, "Contact created", dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ContactDto>> update(HttpServletRequest req,
                                                          @PathVariable String id,
                                                          @Valid @RequestBody ContactUpdateRequest body) {
        String email = extractEmail(req);
        ContactDto dto = contactService.updateContact(email, id, body);
        return ResponseEntity.ok(new ApiResponse<>(true, "Contact updated", dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(HttpServletRequest req, @PathVariable String id) {
        String email = extractEmail(req);
        contactService.deleteContact(email, id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Contact deleted", null));
    }
}
