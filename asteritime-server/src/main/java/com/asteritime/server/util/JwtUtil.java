package com.asteritime.server.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT Token 工具类
 * 用于生成和验证 JWT token
 */
@Component
public class JwtUtil {

    // JWT 密钥（实际生产环境应该从配置文件读取，且应该足够长和复杂）
    private static final String SECRET_KEY = "AsteriTimeSecretKeyForJWTTokenGeneration2025ThisShouldBeLongEnough";
    
    // Token 过期时间：7天（单位：毫秒）
    private static final long EXPIRATION_TIME = 7 * 24 * 60 * 60 * 1000L;

    /**
     * 生成 JWT token
     *
     * @param userId 用户ID
     * @return JWT token 字符串
     */
    public String generateToken(Long userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + EXPIRATION_TIME);

        SecretKey key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes());

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(String.valueOf(userId))
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(key, SignatureAlgorithm.HS512)
                .compact();
    }

    /**
     * 从 token 中提取用户ID
     *
     * @param token JWT token
     * @return 用户ID，如果 token 无效则返回 null
     */
    public Long getUserIdFromToken(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            Object userIdObj = claims.get("userId");
            if (userIdObj instanceof Integer) {
                return ((Integer) userIdObj).longValue();
            } else if (userIdObj instanceof Long) {
                return (Long) userIdObj;
            } else {
                return Long.parseLong(String.valueOf(userIdObj));
            }
        } catch (Exception e) {
            // Token 无效、过期或格式错误
            return null;
        }
    }

    /**
     * 验证 token 是否有效
     *
     * @param token JWT token
     * @return true 如果 token 有效，false 否则
     */
    public boolean validateToken(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
            Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}

