package com.asteritime.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.retry.annotation.EnableRetry;

@SpringBootApplication
@EntityScan(basePackages = "com.asteritime.common.model")
@EnableJpaRepositories(basePackages = "com.asteritime.server.repository")
@EnableRetry  // 启用Spring Retry支持，用于乐观锁重试机制
public class AsteriTimeApplication {
    
    /**
     * 注意：不设置默认时区，让系统使用UTC
     * LocalDate 和 LocalDateTime 不包含时区信息，它们表示的是"本地"日期时间
     * 前端会根据浏览器的时区自动处理日期显示
     * 数据库存储时使用UTC，前端显示时转换为用户本地时区
     */
    public static void main(String[] args) {
        SpringApplication.run(AsteriTimeApplication.class, args);
    }
}


