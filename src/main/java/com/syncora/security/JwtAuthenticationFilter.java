package com.syncora.security;

import com.syncora.user.entity.User;
import com.syncora.user.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;

    protected void doFilterInternal(@NonNull HttpServletRequest req, @NonNull HttpServletResponse res,
            @NonNull FilterChain chain) throws IOException, ServletException {

        String path = req.getRequestURI();
        if (path.startsWith("/ws") || "websocket".equalsIgnoreCase(req.getHeader("Upgrade"))) {
            chain.doFilter(req, res);
            return;
        }

        String token = SecurityUtils.extractToken(req);
        if (token != null) {
            try {
                String email = jwtProvider.extractEmail(token);
                if (email != null) {
                    User user = userRepository.findByEmail(email).orElse(null);
                    if (user != null) {
                        var auth = new UsernamePasswordAuthenticationToken(email, null, List.of());
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    }
                }
            } catch (Exception e) {
                // Log but don't fail the request - let Spring Security handle it
                System.err.println("JWT Authentication failed: " + e.getMessage());
            }
        }
        chain.doFilter(req, res);
    }
}
