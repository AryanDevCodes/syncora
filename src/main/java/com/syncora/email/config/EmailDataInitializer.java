package com.syncora.email.config;

import com.syncora.email.entity.Email;
import com.syncora.email.entity.Email.EmailFolder;
import com.syncora.email.repository.EmailRepository;
import com.syncora.user.entity.User;
import com.syncora.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class EmailDataInitializer {
    
    @Bean
    public CommandLineRunner initializeEmailData(EmailRepository emailRepository, UserRepository userRepository) {
        return args -> {
            if (emailRepository.count() > 0) {
                log.info("Email data already exists, skipping initialization");
                return;
            }
            
            log.info("Initializing sample email data...");
            
            // Get the specific test user
            User firstUser = userRepository.findByEmail("testuser15@gmail.com").orElse(null);
            if (firstUser == null) {
                log.warn("User testuser15@gmail.com not found, skipping email initialization");
                return;
            }
            
            String userEmail = firstUser.getEmail();
            
            List<Email> sampleEmails = new ArrayList<>();
            
            // Inbox emails
            sampleEmails.add(Email.builder()
                    .from("team@syncora.com")
                    .fromName("Syncora Team")
                    .to(List.of(userEmail))
                    .subject("Welcome to Syncora!")
                    .body("Hi " + firstUser.getName() + ",\n\nWelcome to Syncora! We're excited to have you on board. Syncora is your all-in-one collaboration platform for teams.\n\nGet started by:\n- Inviting team members\n- Creating your first note\n- Starting a video call\n\nBest regards,\nThe Syncora Team")
                    .isRead(false)
                    .isStarred(true)
                    .folder(EmailFolder.INBOX)
                    .sentAt(LocalDateTime.now().minusDays(1))
                    .ownerEmail(userEmail)
                    .build());
            
            sampleEmails.add(Email.builder()
                    .from("notifications@syncora.com")
                    .fromName("Syncora Notifications")
                    .to(List.of(userEmail))
                    .subject("Your daily summary")
                    .body("Good morning!\n\nHere's your daily summary:\n- 3 new messages in your inbox\n- 2 tasks due today\n- 1 upcoming meeting\n\nHave a productive day!")
                    .isRead(false)
                    .isStarred(false)
                    .folder(EmailFolder.INBOX)
                    .sentAt(LocalDateTime.now().minusHours(8))
                    .ownerEmail(userEmail)
                    .build());
            
            sampleEmails.add(Email.builder()
                    .from("support@syncora.com")
                    .fromName("Syncora Support")
                    .to(List.of(userEmail))
                    .subject("Tips for getting the most out of Syncora")
                    .body("Hi there,\n\nHere are some tips to help you get the most out of Syncora:\n\n1. Use keyboard shortcuts for faster navigation\n2. Organize your notes with labels\n3. Set up recurring tasks for regular activities\n4. Use the whiteboard for brainstorming sessions\n\nNeed help? Just reply to this email!\n\nCheers,\nSupport Team")
                    .isRead(true)
                    .isStarred(false)
                    .folder(EmailFolder.INBOX)
                    .sentAt(LocalDateTime.now().minusDays(2))
                    .ownerEmail(userEmail)
                    .build());
            
            // Get another user for collaboration email (if exists)
            List<User> otherUsers = userRepository.findAll().stream()
                    .filter(u -> !u.getEmail().equals(userEmail))
                    .toList();
            
            if (!otherUsers.isEmpty()) {
                User secondUser = otherUsers.get(0);
                sampleEmails.add(Email.builder()
                        .from(secondUser.getEmail())
                        .fromName(secondUser.getName())
                        .to(List.of(userEmail))
                        .subject("Project collaboration")
                        .body("Hey " + firstUser.getName() + ",\n\nI'd like to collaborate with you on the new project. Can we schedule a video call this week to discuss the details?\n\nLet me know your availability.\n\nThanks,\n" + secondUser.getName())
                        .isRead(false)
                        .isStarred(true)
                        .folder(EmailFolder.INBOX)
                        .sentAt(LocalDateTime.now().minusHours(3))
                        .ownerEmail(userEmail)
                        .build());
            }
            
            // Sent emails
            sampleEmails.add(Email.builder()
                    .from(userEmail)
                    .fromName(firstUser.getName())
                    .to(List.of("feedback@syncora.com"))
                    .subject("Feedback on Syncora")
                    .body("Hi,\n\nI've been using Syncora for a few days now and I'm really impressed with the features. The interface is clean and intuitive.\n\nOne suggestion: it would be great to have email notifications for chat messages.\n\nKeep up the great work!")
                    .isRead(true)
                    .isStarred(false)
                    .folder(EmailFolder.SENT)
                    .sentAt(LocalDateTime.now().minusDays(1).minusHours(5))
                    .ownerEmail(userEmail)
                    .build());
            
            // Drafts
            sampleEmails.add(Email.builder()
                    .from(userEmail)
                    .fromName(firstUser.getName())
                    .to(List.of("team@example.com"))
                    .subject("Meeting notes - Draft")
                    .body("Hi team,\n\nHere are the notes from our last meeting:\n\n[To be completed...]")
                    .isRead(false)
                    .isStarred(false)
                    .folder(EmailFolder.DRAFTS)
                    .sentAt(LocalDateTime.now().minusHours(12))
                    .ownerEmail(userEmail)
                    .build());
            
            // Archive
            sampleEmails.add(Email.builder()
                    .from("newsletter@syncora.com")
                    .fromName("Syncora Newsletter")
                    .to(List.of(userEmail))
                    .subject("Monthly newsletter - October 2025")
                    .body("What's new in Syncora this month:\n\n- New video calling features\n- Improved whiteboard collaboration\n- Performance enhancements\n\nRead more on our blog!")
                    .isRead(true)
                    .isStarred(false)
                    .folder(EmailFolder.ARCHIVE)
                    .sentAt(LocalDateTime.now().minusDays(5))
                    .ownerEmail(userEmail)
                    .build());
            
            emailRepository.saveAll(sampleEmails);
            log.info("Created {} sample emails for user: {}", sampleEmails.size(), userEmail);
        };
    }
}
