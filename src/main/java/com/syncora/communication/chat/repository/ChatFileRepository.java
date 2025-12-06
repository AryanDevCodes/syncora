package com.syncora.communication.chat.repository;

import com.syncora.communication.chat.entity.ChatFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatFileRepository extends JpaRepository<ChatFile, String> {
    
    List<ChatFile> findByMessageId(String messageId);
    
    List<ChatFile> findByUploadedBy(String uploadedBy);
    
    Optional<ChatFile> findById(String id);
}
