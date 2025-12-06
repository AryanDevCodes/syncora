package com.syncora.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JwtProvider: Handles generation, parsing, and validation of access and refresh tokens.
 */
@Slf4j
@Component
@Getter
public class JwtProvider {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long accessExpiration;

    @Value("${jwt.refresh-expiration}")
    private Long refreshExpiration;

    private byte[] secretKeyBytes() {
        return secret.getBytes(StandardCharsets.UTF_8);
    }

    /** -------------------- TOKEN GENERATION -------------------- */

    public String generateAccessToken(String email) {
        return buildToken(email, accessExpiration);
    }

    public String generateRefreshToken(String email) {
        return buildToken(email, refreshExpiration);
    }

    private String buildToken(String email, Long duration) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + duration);
        try {
            return Jwts.builder()
                    .header()
                    .type("JWT")
                    .and()
                    .subject(email)
                    .issuedAt(now)
                    .expiration(expiryDate)
                    .signWith(Keys.hmacShaKeyFor(secretKeyBytes()), Jwts.SIG.HS384)
                    .compact();
        } catch (Exception e) {
            log.error("Token generation failed: {}", e.getMessage(), e);
            throw new JwtException("Unable to generate token", e);
        }
    }

    /** -------------------- TOKEN PARSING -------------------- */

    public Claims parseClaims(String rawToken) {
        String token = sanitizeToken(rawToken);
        if (token == null) throw new JwtException("Token is missing or empty");

        long dots = token.chars().filter(ch -> ch == '.').count();
        if (dots != 2) {
            log.warn("Invalid compact JWT string - dotCount={}", dots);
            throw new JwtException("Invalid compact JWT string: expected 2 periods, found " + dots);
        }

        try {
            return Jwts.parser()
                    .verifyWith(Keys.hmacShaKeyFor(secretKeyBytes()))
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException e) {
            log.warn("JWT parsing failed: {}", e.getMessage());
            throw e;
        }
    }

    private String sanitizeToken(String raw) {
        if (raw == null) return null;
        String t = raw.trim();
        if (t.startsWith("Bearer ")) t = t.substring(7).trim();
        if (t.startsWith("\"") && t.endsWith("\"")) t = t.substring(1, t.length() - 1);
        return t.replaceAll("[\\n\\r]", "").trim().isEmpty() ? null : t;
    }

    /** -------------------- TOKEN VALIDATION -------------------- */

    public boolean isTokenValid(String token) {
        try {
            Claims claims = parseClaims(token);
            Date exp = claims.getExpiration();
            if (exp != null && exp.before(new Date())) {
                log.warn("JWT token expired at {}", exp);
                return false;
            }
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("JWT validation failed: {}", e.getMessage());
            return false;
        }
    }

    /** -------------------- CLAIM EXTRACTION -------------------- */

    public String extractEmail(String token) {
        try {
            return parseClaims(token).getSubject();
        } catch (Exception e) {
            log.warn("extractEmail failed: {}", e.getMessage());
            return null;
        }
    }

    public Date getExpirationTime(String token) {
        try {
            return parseClaims(token).getExpiration();
        } catch (Exception e) {
            log.warn("Failed to extract expiration: {}", e.getMessage());
            return null;
        }
    }

}
