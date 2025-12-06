package com.syncora.email.repository;

import com.syncora.email.entity.Email;
import com.syncora.email.entity.Email.EmailFolder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmailRepository extends JpaRepository<Email, String> {
    
    List<Email> findByOwnerEmailOrderBySentAtDesc(String ownerEmail);
    
    List<Email> findByOwnerEmailAndFolderOrderBySentAtDesc(String ownerEmail, EmailFolder folder);
    
    List<Email> findByOwnerEmailAndIsStarredOrderBySentAtDesc(String ownerEmail, Boolean isStarred);
    
    List<Email> findByOwnerEmailAndIsReadOrderBySentAtDesc(String ownerEmail, Boolean isRead);
    
    @Query("SELECT e FROM Email e WHERE e.ownerEmail = :ownerEmail AND " +
           "(LOWER(e.subject) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.body) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.from) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Email> searchEmails(@Param("ownerEmail") String ownerEmail, @Param("query") String query);
    
    @Query("SELECT COUNT(e) FROM Email e WHERE e.ownerEmail = :ownerEmail AND e.folder = :folder AND e.isRead = false")
    Long countUnreadByFolder(@Param("ownerEmail") String ownerEmail, @Param("folder") EmailFolder folder);
    
    Long countByOwnerEmailAndFolder(String ownerEmail, EmailFolder folder);
}
