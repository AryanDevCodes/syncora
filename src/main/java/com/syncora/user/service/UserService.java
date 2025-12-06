package com.syncora.user.service;


import com.syncora.user.dto.UpdateUserRequest;
import com.syncora.user.dto.UserDto;

public interface UserService {

    UserDto getByEmail(String email);
    UserDto getById(String id);

    UserDto updateByEmail(String email, UpdateUserRequest userDto);

    void deleteByEmail(String email);

    /**
     * Returns a simple export payload for the given user email.
     * This can be extended to include related entities.
     */
    java.util.Map<String, Object> exportByEmail(String email);
}
