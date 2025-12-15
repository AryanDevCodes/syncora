package com.syncora.security.repository;

import com.syncora.security.entity.RefreshToken;
import com.syncora.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, String> {
    Optional<RefreshToken> findByToken(String token);

    @Modifying
    @Transactional
    void deleteByUser(User user);
    
    @Modifying
    @Transactional
    void deleteAllByUser(User user);
}
