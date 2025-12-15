package com.asteritime.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.retry.annotation.EnableRetry;

@SpringBootApplication
@EntityScan(basePackages = "com.asteritime.common.model")
@EnableJpaRepositories(basePackages = "com.asteritime.server.repository")
@EnableRetry  // Enable Spring Retry support for optimistic locking retry mechanism
public class AsteriTimeApplication {
    
    /**
     * Note: Do not set default timezone, let system use UTC
     * LocalDate and LocalDateTime do not contain timezone information, they represent "local" date time
     * Frontend will automatically handle date display based on browser timezone
     * Database stores in UTC, frontend converts to user's local timezone for display
     */
    public static void main(String[] args) {
        SpringApplication.run(AsteriTimeApplication.class, args);
    }
}


