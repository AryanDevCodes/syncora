package com.syncora.security;

import jakarta.servlet.http.HttpServletRequest;

public class SecurityUtils {
    public static String extractToken(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");

        return auth !=null && auth.startsWith("Bearer ") ? auth.substring(7) : null;
    }
}
