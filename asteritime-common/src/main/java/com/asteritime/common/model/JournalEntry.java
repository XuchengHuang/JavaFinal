package com.asteritime.common.model;

import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 每日专注总结条目
 *
 * 用于记录：
 *   - 某一天的日期（年月日）
 *   - 当天专注总时长（分钟）
 *   - 用户对这一天的主观评价（可为空）
 *   - 归属用户（每个用户每天最多一条）
 */
@Entity
@Table(
        name = "journal_entries",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"user_id", "date"})
        }
)
public class JournalEntry {
    
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
     * 日期（仅年月日）
     */
    @Column(nullable = false)
    private LocalDate date;
    
    /**
     * 当天专注总时长（分钟）
     * 默认值为 0
     */
    @Column(nullable = false)
    private Integer totalFocusMinutes = 0;
    
    /**
     * 对这一天的评价 / 总结（可为空）
     */
    @Column(columnDefinition = "TEXT")
    private String evaluation;
    
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

    public LocalDate getDate() {
        return date;
    }
    
    public void setDate(LocalDate date) {
        this.date = date;
    }
    
    public Integer getTotalFocusMinutes() {
        return totalFocusMinutes;
    }
    
    public void setTotalFocusMinutes(Integer totalFocusMinutes) {
        this.totalFocusMinutes = totalFocusMinutes;
    }
    
    public String getEvaluation() {
        return evaluation;
    }
    
    public void setEvaluation(String evaluation) {
        this.evaluation = evaluation;
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


