package com.asteritime.server.service;

import com.asteritime.common.model.User;
import com.asteritime.server.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class UserService {

    @Autowired
    private UserRepository userRepository;

    /**
     * Register new user:
     *   - Email must be unique
     *   - Simple example: password is stored in plain text (encryption recommended for production)
     */
    public Optional<User> register(String username, String email, String password) {
        if (userRepository.findByEmail(email).isPresent()) {
            return Optional.empty();
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(password);

        return Optional.of(userRepository.save(user));
    }

    /**
     * Login validation: Find user by email and password.
     * Returns User on success, Optional.empty on failure.
     */
    public Optional<User> login(String email, String password) {
        return userRepository.findByEmailAndPassword(email, password);
    }
}


