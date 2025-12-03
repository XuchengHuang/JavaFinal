package com.asteritime.common.model;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * 任务重复频率规则
 *
 * 说明：
 *   - 目前只包含：规则 ID + 频率表达式
 *   - 频率表达式可以是可读字符串，例如：
 *       "1/day"   -> 一天一次
 *       "2/day"   -> 一天两次
 *       "1/week"  -> 一周一次
 *   - 后续如果要支持更复杂的自定义（比如具体时间点、每周几），可以：
 *       1) 约定更丰富的表达式格式，或者
 *       2) 拆成多个字段（单位、间隔、每天次数、具体时间点等）
 */
@Entity
@Table(
    name = "task_recurrence_rules",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "frequency_expression"})
    }
)
public class TaskRecurrenceRule {

    /**
     * 规则 ID（主键）
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 所属用户（外键关联到 users 表）
     */
    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * 重复频率表达式（同一用户下唯一）
     *
     * 示例：
     *   - "1/day"  -> 一天一次
     *   - "2/day"  -> 一天两次
     */
    @Column(name = "frequency_expression", nullable = false)
    private String frequencyExpression;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getFrequencyExpression() {
        return frequencyExpression;
    }

    public void setFrequencyExpression(String frequencyExpression) {
        this.frequencyExpression = frequencyExpression;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}


