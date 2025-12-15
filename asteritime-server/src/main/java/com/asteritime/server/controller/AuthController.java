package com.asteritime.server.controller;

import com.asteritime.common.model.User;
import com.asteritime.server.service.UserService;
import com.asteritime.server.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * User authentication endpoints: register + login + logout
 * 
 * Note:
 *   - Returns JWT token after successful login
 *   - Other endpoints require Authorization header: Bearer <token>
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * User registration
     * 
     * URL: POST /api/auth/register
     * 
     * Request body example:
     *   {
     *     "username": "Alice",
     *     "email": "alice@example.com",
     *     "password": "123456"
     *   }
     * 
     * Returns 400 if email already registered, otherwise creates new user
     */
    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody RegisterRequest request) {
        if (request.getUsername() == null || request.getEmail() == null || request.getPassword() == null) {
            return ResponseEntity.badRequest().build();
        }

        Optional<User> created = userService.register(
                request.getUsername(),
                request.getEmail(),
                request.getPassword()
        );

        if (!created.isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(created.get());
    }

    /**
     * User login
     * 
     * URL: POST /api/auth/login
     * 
     * Request body example:
     *   {
     *     "email": "alice@example.com",
     *     "password": "123456"
     *   }
     * 
     * Response example:
     *   {
     *     "token": "eyJhbGciOiJIUzUxMiJ9...",
     *     "user": {
     *       "id": 1,
     *       "username": "Alice",
     *       "email": "alice@example.com"
     *     }
     *   }
     * 
     * Returns token if email and password match, otherwise returns 401
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            return ResponseEntity.badRequest().build();
        }

        Optional<User> userOpt = userService.login(request.getEmail(), request.getPassword());
        if (!userOpt.isPresent()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userOpt.get();
        String token = jwtUtil.generateToken(user.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", user);

        return ResponseEntity.ok(response);
    }

    /**
     * User logout
     * 
     * URL: POST /api/auth/logout
     * Header: Authorization: Bearer <token>
     * 
     * Validates token and returns success response. Frontend should delete local token.
     * Note: JWT tokens are stateless, server cannot actively revoke tokens.
     * For immediate invalidation, consider implementing token blacklist (e.g., Redis)
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Map<String, String> response = new HashMap<>();
        response.put("message", "Logout successful");
        return ResponseEntity.ok(response);
    }

    public static class RegisterRequest {
        private String username;
        private String email;
        private String password;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    public static class LoginRequest {
        private String email;
        private String password;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }
}


