package com.syncora.communication.chat.controller;

import com.syncora.communication.chat.dto.ChatFileDto;
import com.syncora.communication.chat.entity.ChatFile;
import com.syncora.communication.chat.service.ChatFileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/chat/files")
@RequiredArgsConstructor
@Slf4j
public class ChatFileController {
    
    private final ChatFileService chatFileService;
    
    @PostMapping("/upload")
    public ResponseEntity<ChatFileDto> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "messageId", required = false) String messageId,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            ChatFileDto fileDto = chatFileService.uploadFile(file, userEmail, messageId);
            return ResponseEntity.ok(fileDto);
        } catch (IOException e) {
            log.error("Error uploading file", e);
            return ResponseEntity.internalServerError().build();
        } catch (IllegalArgumentException e) {
            log.error("Invalid file upload request", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/{fileId}/download")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable String fileId,
            Authentication authentication) {
        try {
            ChatFile chatFile = chatFileService.getFile(fileId);
            
            ByteArrayResource resource = new ByteArrayResource(chatFile.getFileData());
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(chatFile.getFileType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                            "attachment; filename=\"" + chatFile.getFileName() + "\"")
                    .contentLength(chatFile.getFileSize())
                    .body(resource);
        } catch (RuntimeException e) {
            log.error("Error downloading file: {}", fileId, e);
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{fileId}")
    public ResponseEntity<Void> deleteFile(
            @PathVariable String fileId,
            Authentication authentication) {
        try {
            chatFileService.deleteFile(fileId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("Error deleting file: {}", fileId, e);
            return ResponseEntity.notFound().build();
        }
    }
}
