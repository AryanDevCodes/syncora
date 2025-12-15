package com.syncora.contact.repository;

import com.syncora.contact.Contact;
import com.syncora.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContactRepository extends JpaRepository<Contact, String> {
    
    @Modifying
    @Transactional
    void deleteAllByOwner(User owner);

    List<Contact> findByOwner(User owner);

    Optional<Contact> findByIdAndOwnerId(String id, String ownerId);

    boolean existsByEmailAndOwner(String email, User owner);

    @Query("SELECT c.email FROM Contact c WHERE c.owner.email = :ownerEmail")
    List<String> findEmailsByOwnerEmail(@Param("ownerEmail") String ownerEmail);

}
