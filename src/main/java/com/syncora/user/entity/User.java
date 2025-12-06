package com.syncora.user.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    @Column(unique = true, nullable = false,  length = 50)
    private String email;
    @Column(nullable = true)  // Changed to nullable for OAuth users
    private String passwordHash;
    @Column(nullable = false,   length = 50)
    private String firstName;
    @Column(nullable = false,   length = 50)
    private String lastName;

    @Column(length = 1000)
    private String avatarUrl;

    // OAuth2 fields
    @Column(length = 20)
    private String provider; // GITHUB, GOOGLE, LOCAL
    
    @Column(length = 100)
    private String providerId; // OAuth provider's user ID
    
    @Column(length = 1000)
    private String providerProfileUrl;

    @Builder.Default
    @Column(nullable = false,   length = 50)
    private String role = "ROLE_USER";

    @Builder.Default
    @Column(nullable = false)
    private boolean isActive = true;

    private String subscriptionPlan;

    @Builder.Default
    private Long storageUsedBytes = 0L;

    // Notification settings
    @Builder.Default
    private Boolean emailNotifications = true;
    @Builder.Default
    private Boolean pushNotifications = true;
    @Builder.Default
    private Boolean chatNotifications = true;
    @Builder.Default
    private Boolean taskNotifications = true;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    @Builder.Default
    private LocalDateTime deletedAt = LocalDateTime.now();


    @PreUpdate
    public void preUpdate()
    {
        this.createdAt = LocalDateTime.now();
    }


    public String getName() {
        if (firstName == null && lastName == null) {
            return email != null ? email.split("@")[0] : "Unknown User";
        }
        if (firstName == null) {
            return lastName;
        }
        if (lastName == null) {
            return firstName;
        }
        return firstName + " " + lastName;
    }

}
