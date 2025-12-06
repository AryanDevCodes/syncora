package com.syncora.security;

import com.syncora.security.dto.JwtResponse;
import com.syncora.security.dto.LoginRequest;
import com.syncora.security.dto.SignupRequest;

public interface AuthService {
    JwtResponse login(LoginRequest loginRequest);
    void signUp(SignupRequest   signupRequest);

    JwtResponse refreshToken(String refreshToken);

    boolean checkUserIsActive(String email);
}
