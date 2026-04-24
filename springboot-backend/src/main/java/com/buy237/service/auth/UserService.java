package com.buy237.service.auth;

import com.buy237.model.auth.User;
import com.buy237.repository.auth.UserRepository;
import com.buy237.dto.auth.RegisterRequest;
import com.buy237.dto.auth.LoginRequest;
import com.buy237.dto.auth.AuthResponse;
import com.buy237.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtService jwtService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .role("USER")
                .enabled(true)
                .build();
        userRepository.save(user);
        String token = jwtService.generateToken(user.getEmail());
        return new AuthResponse(token, user.getEmail(), user.getName(), user.getRole());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        String token = jwtService.generateToken(user.getEmail());
        return new AuthResponse(token, user.getEmail(), user.getName(), user.getRole());
    }
}
