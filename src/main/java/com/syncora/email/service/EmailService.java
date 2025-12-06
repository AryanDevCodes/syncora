package com.syncora.email.service;

import com.syncora.email.dto.EmailComposeRequest;
import com.syncora.email.dto.EmailDto;
import com.syncora.email.entity.Email;
import com.syncora.email.entity.Email.EmailFolder;
import com.syncora.email.mapper.EmailMapper;
import com.syncora.email.repository.EmailRepository;
import com.syncora.user.entity.User;
import com.syncora.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmailService {
    
    private final EmailRepository emailRepository;
    private final UserRepository userRepository;
    private final EmailMapper emailMapper;
    
    public List<EmailDto> getEmails(String ownerEmail, String folder, Boolean isRead, 
                                     Boolean isStarred, String search) {
        List<Email> emails;
        
        if (search != null && !search.isEmpty()) {
            emails = emailRepository.searchEmails(ownerEmail, search);
        } else if (folder != null && !folder.isEmpty()) {
            EmailFolder folderEnum = EmailFolder.valueOf(folder.toUpperCase());
            emails = emailRepository.findByOwnerEmailAndFolderOrderBySentAtDesc(ownerEmail, folderEnum);
        } else if (isStarred != null) {
            emails = emailRepository.findByOwnerEmailAndIsStarredOrderBySentAtDesc(ownerEmail, isStarred);
        } else if (isRead != null) {
            emails = emailRepository.findByOwnerEmailAndIsReadOrderBySentAtDesc(ownerEmail, isRead);
        } else {
            emails = emailRepository.findByOwnerEmailOrderBySentAtDesc(ownerEmail);
        }
        
        return emails.stream()
                .map(emailMapper::toDto)
                .collect(Collectors.toList());
    }
    
    public EmailDto getEmail(String id, String ownerEmail) {
        Email email = emailRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Email not found"));
        
        if (!email.getOwnerEmail().equals(ownerEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        
        return emailMapper.toDto(email);
    }
    
    @Transactional
    public EmailDto sendEmail(String senderEmail, EmailComposeRequest request) {
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sender not found"));
        
        LocalDateTime sentTime = LocalDateTime.now();
        
        // Create email for sender (sent folder)
        Email sentEmail = Email.builder()
                .from(senderEmail)
                .fromName(sender.getName())
                .to(new ArrayList<>(request.getTo()))
                .cc(request.getCc() != null ? new ArrayList<>(request.getCc()) : new ArrayList<>())
                .bcc(request.getBcc() != null ? new ArrayList<>(request.getBcc()) : new ArrayList<>())
                .subject(request.getSubject())
                .body(request.getBody())
                .htmlBody(request.getHtmlBody())
                .isRead(true)
                .isStarred(false)
                .folder(EmailFolder.SENT)
                .sentAt(sentTime)
                .ownerEmail(senderEmail)
                .build();
        
        emailRepository.save(sentEmail);
        System.out.println("✅ Sent email saved for sender: " + senderEmail);
        
        // Collect all recipients (To, Cc, Bcc)
        Set<String> allRecipients = new HashSet<>(request.getTo());
        if (request.getCc() != null && !request.getCc().isEmpty()) {
            allRecipients.addAll(request.getCc());
        }
        if (request.getBcc() != null && !request.getBcc().isEmpty()) {
            allRecipients.addAll(request.getBcc());
        }
        
        // Remove sender from recipients (in case they included themselves)
        allRecipients.remove(senderEmail);
        
        System.out.println("📧 Creating inbox emails for " + allRecipients.size() + " recipients: " + allRecipients);
        
        // Create inbox email for each recipient
        int successCount = 0;
        int skipCount = 0;
        
        for (String recipientEmail : allRecipients) {
            Optional<User> recipientOpt = userRepository.findByEmail(recipientEmail);
            
            if (recipientOpt.isPresent()) {
                User recipient = recipientOpt.get();
                
                // Create inbox email for this recipient
                Email inboxEmail = Email.builder()
                        .from(senderEmail)
                        .fromName(sender.getName())
                        .to(new ArrayList<>(request.getTo()))
                        .cc(request.getCc() != null ? new ArrayList<>(request.getCc()) : new ArrayList<>())
                        .bcc(request.getBcc() != null ? new ArrayList<>(request.getBcc()) : new ArrayList<>())
                        .subject(request.getSubject())
                        .body(request.getBody())
                        .htmlBody(request.getHtmlBody())
                        .isRead(false)
                        .isStarred(false)
                        .folder(EmailFolder.INBOX)
                        .sentAt(sentTime)
                        .ownerEmail(recipientEmail)
                        .build();
                
                emailRepository.save(inboxEmail);
                successCount++;
                System.out.println("  ✅ Inbox email created for: " + recipientEmail);
            } else {
                skipCount++;
                System.out.println("  ⚠️ User not found, skipping: " + recipientEmail);
            }
        }
        
        System.out.println("📊 Email delivery summary: " + successCount + " delivered, " + skipCount + " skipped (user not found)");
        
        return emailMapper.toDto(sentEmail);
    }
    
    @Transactional
    public EmailDto saveDraft(String ownerEmail, EmailComposeRequest request) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        
        Email draft = Email.builder()
                .from(ownerEmail)
                .fromName(owner.getName())
                .to(request.getTo())
                .cc(request.getCc())
                .bcc(request.getBcc())
                .subject(request.getSubject())
                .body(request.getBody())
                .htmlBody(request.getHtmlBody())
                .isRead(false)
                .isStarred(false)
                .folder(EmailFolder.DRAFTS)
                .sentAt(LocalDateTime.now())
                .ownerEmail(ownerEmail)
                .build();
        
        emailRepository.save(draft);
        return emailMapper.toDto(draft);
    }
    
    @Transactional
    public void markAsRead(String id, String ownerEmail, Boolean isRead) {
        Email email = emailRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Email not found"));
        
        if (!email.getOwnerEmail().equals(ownerEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        
        email.setIsRead(isRead);
        emailRepository.save(email);
    }
    
    @Transactional
    public void toggleStar(String id, String ownerEmail) {
        Email email = emailRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Email not found"));
        
        if (!email.getOwnerEmail().equals(ownerEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        
        email.setIsStarred(!email.getIsStarred());
        emailRepository.save(email);
    }
    
    @Transactional
    public void moveToFolder(String id, String ownerEmail, String folderName) {
        Email email = emailRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Email not found"));
        
        if (!email.getOwnerEmail().equals(ownerEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        
        EmailFolder folder = EmailFolder.valueOf(folderName.toUpperCase());
        email.setFolder(folder);
        emailRepository.save(email);
    }
    
    @Transactional
    public void bulkMarkAsRead(String ownerEmail, List<String> ids, Boolean isRead) {
        for (String id : ids) {
            try {
                markAsRead(id, ownerEmail, isRead);
            } catch (Exception e) {
                // Continue with other emails
            }
        }
    }
    
    @Transactional
    public void bulkMoveToFolder(String ownerEmail, List<String> ids, String folder) {
        for (String id : ids) {
            try {
                moveToFolder(id, ownerEmail, folder);
            } catch (Exception e) {
                // Continue with other emails
            }
        }
    }
    
    @Transactional
    public void bulkDelete(String ownerEmail, List<String> ids) {
        for (String id : ids) {
            try {
                deleteEmail(id, ownerEmail);
            } catch (Exception e) {
                // Continue with other emails
            }
        }
    }
    
    @Transactional
    public void deleteEmail(String id, String ownerEmail) {
        Email email = emailRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Email not found"));
        
        if (!email.getOwnerEmail().equals(ownerEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        
        emailRepository.delete(email);
    }
    
    public Map<String, Long> getEmailCounts(String ownerEmail) {
        Map<String, Long> counts = new HashMap<>();
        
        for (EmailFolder folder : EmailFolder.values()) {
            Long unreadCount = emailRepository.countUnreadByFolder(ownerEmail, folder);
            if (unreadCount > 0) {
                counts.put(folder.name().toLowerCase(), unreadCount);
            }
        }
        
        return counts;
    }
    
    public List<EmailDto> getAllEmailsForDebug(String ownerEmail) {
        List<Email> allEmails = emailRepository.findByOwnerEmailOrderBySentAtDesc(ownerEmail);
        System.out.println("🔍 DEBUG: Found " + allEmails.size() + " emails for " + ownerEmail);
        for (Email email : allEmails) {
            System.out.println("  - From: " + email.getFrom() + " | Subject: " + email.getSubject() + 
                             " | Folder: " + email.getFolder() + " | To: " + email.getTo());
        }
        return allEmails.stream()
                .map(emailMapper::toDto)
                .collect(Collectors.toList());
    }
}
