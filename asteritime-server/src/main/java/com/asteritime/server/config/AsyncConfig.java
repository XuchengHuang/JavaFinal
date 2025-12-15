package com.asteritime.server.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * 异步任务配置类
 * 
 * 用于配置后台异步任务处理的线程池
 * 可以用于处理一些不需要立即返回结果的操作，如：
 * - 日志记录
 * - 统计分析
 * - 邮件发送
 * - 数据清理等
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * 配置异步任务执行器
     * 
     * @return 线程池执行器
     */
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        // 核心线程数（保持运行的线程数）
        executor.setCorePoolSize(5);
        
        // 最大线程数（线程池中允许的最大线程数）
        executor.setMaxPoolSize(20);
        
        // 队列容量（等待执行的任务数）
        executor.setQueueCapacity(100);
        
        // 线程名前缀（便于日志追踪）
        executor.setThreadNamePrefix("async-task-");
        
        // 线程空闲时间（秒），超过此时间的空闲线程将被回收
        executor.setKeepAliveSeconds(60);
        
        // 拒绝策略：当线程池和队列都满时，调用者线程执行任务
        executor.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
        
        // 等待所有任务完成后再关闭线程池
        executor.setWaitForTasksToCompleteOnShutdown(true);
        
        // 等待时间（秒）
        executor.setAwaitTerminationSeconds(60);
        
        executor.initialize();
        return executor;
    }
}
