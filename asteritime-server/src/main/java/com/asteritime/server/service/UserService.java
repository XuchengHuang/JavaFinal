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
     * 注册新用户：
     *   - 要求邮箱唯一
     *   - 简单示例：暂不做密码加密，直接保存原文密码（实际项目建议加密）
     */
    public Optional<User> register(String username, String email, String password) {
        // 邮箱已存在则注册失败
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
     * 登录校验：根据邮箱和密码查找用户。
     * 成功返回 User，失败返回 Optional.empty。
     */
    public Optional<User> login(String email, String password) {
        return userRepository.findByEmailAndPassword(email, password);
    }
}


