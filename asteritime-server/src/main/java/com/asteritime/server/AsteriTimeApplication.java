package com.asteritime.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan(basePackages = "com.asteritime.common.model")
@EnableJpaRepositories(basePackages = "com.asteritime.server.repository")
public class AsteriTimeApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(AsteriTimeApplication.class, args);
    }
}


