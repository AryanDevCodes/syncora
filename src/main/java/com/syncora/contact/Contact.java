package com.syncora.contact;

import com.syncora.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "contacts", indexes = {
        @Index(name = "idx_contact_owner", columnList = "owner_id"),
        @Index(name = "idx_contact_email", columnList = "email")
})
public class Contact {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false,length = 100)
    private String name;

    @Column(nullable = false,length = 100)
    private String email;

    @Column(nullable = false,length = 15)
    private String phone;

    @Column(nullable = false,length = 100)
    private String organization;

    @Column(length = 100)
    private String position;

    @Column(length = 200)
    private String address;

    @Column(length = 200)
    private String website;

    @Column(length = 50)
    private String secondaryPhone;

    @Column(length = 200)
    private String linkedinUrl;

    @Column(length = 100)
    private String twitterHandle;

    @Column(length = 100)
    private String tags;

    @Column(length = 100)
    private String department;

    @Column(length = 100)
    private String managerName;

    @Column(length = 50)
    private String employeeId;

    private LocalDate startDate;

    @Column(length = 100)
    private String industry;

    private LocalDate birthday;

    private LocalDate anniversary;

    @Column(length = 100)
    private String nickname;

    @Column(length = 1000)
    private String avatarUrl;

    @Column(length = 500)
    private String note;


    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }
    @PreUpdate
    public void preUpdate(){
        updatedAt = LocalDateTime.now();
    }



}
