package com.syncora.email.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "emails")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Email {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(name = "from_email", nullable = false)
    private String from;
    
    @Column(name = "from_name")
    private String fromName;
    
    @ElementCollection
    @CollectionTable(name = "email_recipients", joinColumns = @JoinColumn(name = "email_id"))
    @Column(name = "recipient")
    @Builder.Default
    private List<String> to = new ArrayList<>();
    
    @ElementCollection
    @CollectionTable(name = "email_cc", joinColumns = @JoinColumn(name = "email_id"))
    @Column(name = "cc_recipient")
    @Builder.Default
    private List<String> cc = new ArrayList<>();
    
    @ElementCollection
    @CollectionTable(name = "email_bcc", joinColumns = @JoinColumn(name = "email_id"))
    @Column(name = "bcc_recipient")
    @Builder.Default
    private List<String> bcc = new ArrayList<>();
    
    @Column(nullable = false)
    private String subject;
    
    @Column(columnDefinition = "TEXT")
    private String body;
    
    @Column(name = "html_body", columnDefinition = "TEXT")
    private String htmlBody;
    
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;
    
    @Column(name = "is_starred", nullable = false)
    @Builder.Default
    private Boolean isStarred = false;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EmailFolder folder = EmailFolder.INBOX;
    
    @ElementCollection
    @CollectionTable(name = "email_labels", joinColumns = @JoinColumn(name = "email_id"))
    @Column(name = "label")
    @Builder.Default
    private Set<String> labels = new HashSet<>();
    
    @OneToMany(mappedBy = "email", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EmailAttachment> attachments = new ArrayList<>();
    
    @Column(name = "sent_at")
    private LocalDateTime sentAt;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "owner_email", nullable = false)
    private String ownerEmail;
    
    public enum EmailFolder {
        INBOX, SENT, DRAFTS, TRASH, SPAM, ARCHIVE
    }
}
