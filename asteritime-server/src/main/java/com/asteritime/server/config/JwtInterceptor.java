package com.asteritime.server.config;

import com.asteritime.server.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * JWT Token 拦截器
 * 用于验证请求中的 token，并将 userId 放入 request attribute
 */
@Component
public class JwtInterceptor implements HandlerInterceptor {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 允许 OPTIONS 请求（CORS 预检）
        if ("OPTIONS".equals(request.getMethod())) {
            return true;
        }

        // 获取 Authorization header
        String authHeader = request.getHeader("Authorization");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // 没有 token，返回 401
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"error\":\"Missing or invalid token\"}");
            return false;
        }

        // 提取 token（去掉 "Bearer " 前缀）
        String token = authHeader.substring(7);

        // 验证 token
        if (!jwtUtil.validateToken(token)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"error\":\"Invalid or expired token\"}");
            return false;
        }

        // 从 token 中提取 userId，放入 request attribute，供 Controller 使用
        Long userId = jwtUtil.getUserIdFromToken(token);
        if (userId != null) {
            request.setAttribute("userId", userId);
        }

        return true;
    }
}

