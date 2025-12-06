package com.syncora.communication.chat.service;

import com.syncora.communication.chat.dto.ChatFileDto;
import com.syncora.communication.chat.entity.ChatFile;
import com.syncora.communication.chat.repository.ChatFileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatFileService {
    
    private final ChatFileRepository chatFileRepository;
    
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
    
    @Transactional
    public ChatFileDto uploadFile(MultipartFile file, String uploadedBy, String messageId) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum limit of 10MB");
        }
        
        ChatFile chatFile = ChatFile.builder()
                .fileName(file.getOriginalFilename())
                .fileSize(file.getSize())
                .fileType(file.getContentType())
                .uploadedBy(uploadedBy)
                .messageId(messageId)
                .fileData(file.getBytes())
                .build();
        
        chatFile = chatFileRepository.save(chatFile);
        log.info("File uploaded: {} ({} bytes) by {}", chatFile.getFileName(), chatFile.getFileSize(), uploadedBy);
        
        return toDto(chatFile);
    }
    
    public ChatFile getFile(String fileId) {
        return chatFileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found with id: " + fileId));
    }
    
    public List<ChatFileDto> getFilesByMessageId(String messageId) {
        return chatFileRepository.findByMessageId(messageId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }
    
    public List<ChatFileDto> getFilesByUser(String userEmail) {
        return chatFileRepository.findByUploadedBy(userEmail)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public void deleteFile(String fileId) {
        chatFileRepository.deleteById(fileId);
        log.info("File deleted: {}", fileId);
    }
    
    private ChatFileDto toDto(ChatFile chatFile) {
        return ChatFileDto.builder()
                .id(chatFile.getId())
                .messageId(chatFile.getMessageId())
                .fileName(chatFile.getFileName())
                .fileSize(chatFile.getFileSize())
                .fileType(chatFile.getFileType())
                .uploadedBy(chatFile.getUploadedBy())
                .uploadedAt(chatFile.getUploadedAt())
                .downloadUrl("/api/chat/files/" + chatFile.getId() + "/download")
                .build();
    }
}
