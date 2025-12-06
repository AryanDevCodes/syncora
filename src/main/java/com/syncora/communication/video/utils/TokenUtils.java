package com.syncora.communication.video.utils;

import org.springframework.stereotype.Component;

import com.syncora.common.exception.ApiException;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

/**
 * Token and User Utility
 * Provides utility methods for user ID normalization
 */
@Component
@Slf4j
@Getter
public class TokenUtils {

    /**
     * Normalizes a user UUID/ID to an alphanumeric lowercase string
     * Used for creating consistent user identifiers
     */
    public String normalizeUserAccount(String userUuid) {
        if (userUuid == null || userUuid.isBlank()) {
            throw new ApiException("User UUID is required");
        }
        String norm = userUuid.replaceAll("[^A-Za-z0-9]", "").toLowerCase();
        if (norm.isEmpty()) {
            throw new ApiException("Normalized account is empty. UUID=" + userUuid);
        }
        return norm;
    }

    /**
     * Converts a UUID string to a consistent numeric UID
     * Uses hashCode for deterministic conversion
     */
    public int convertUuidToNumericUid(String uuid) {
        if (uuid == null || uuid.isBlank()) {
            throw new ApiException("UUID is required for UID conversion");
        }
        return Math.abs(uuid.hashCode());
    }
}
