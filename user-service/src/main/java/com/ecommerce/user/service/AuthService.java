package com.ecommerce.user.service;

import com.ecommerce.user.dto.request.LoginRequest;
import com.ecommerce.user.dto.request.RegisterRequest;
import com.ecommerce.user.dto.response.JwtResponse;
import com.ecommerce.user.dto.response.UserResponse;

public interface AuthService {
    
    JwtResponse authenticateUser(LoginRequest loginRequest);
    
    UserResponse registerUser(RegisterRequest registerRequest);
} 