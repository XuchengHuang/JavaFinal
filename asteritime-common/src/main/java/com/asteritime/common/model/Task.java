package com.asteritime.common.model;

import javax.persistence.*;
import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import java.time.LocalDateTime;

/**
 * 任务实体
 */
@Entity
@Table(name = "tasks")
public class Task {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    private String description;
    
    /**
     * 四象限：1=Urgent/Important, 2=NotUrgent/Important,
     *         3=Urgent/NotImportant, 4=NotUrgent/NotImportant
     */
    @Min(1)
    @Max(4)
    @Column(nullable = false)
    private Integer quadrant;
    
    /**
     * 任务类型（外键，引用任务类别）
     */
    @ManyToOne
    @JoinColumn(name = "category_id")
    private TaskCategory type;
    
    /**
     * 重复规则（外键，引用任务重复频率规则）
     */
    @ManyToOne
    @JoinColumn(name = "recurrence_rule_id")
    private TaskRecurrenceRule recurrenceRule;
    
    /**
     * 任务状态：
     *   DELAY  - 延期 / 推迟
     *   TODO   - 待办
     *   DOING  - 进行中
     *   DONE   - 已完成
     *   CANCEL - 已取消
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status;
    
    /**
     * 计划开始时间
     */
    private LocalDateTime plannedStartTime;
    
    /**
     * 计划结束时间
     */
    private LocalDateTime plannedEndTime;
    
    /**
     * 实际开始时间
     */
    private LocalDateTime actualStartTime;
    
    /**
     * 实际结束时间
     */
    private LocalDateTime actualEndTime;
    
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
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    /**
     * 所属用户（外键关联到 users 表）
     */
    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public Integer getQuadrant() {
        return quadrant;
    }
    
    public void setQuadrant(Integer quadrant) {
        this.quadrant = quadrant;
    }
    
    public TaskCategory getType() {
        return type;
    }
    
    public void setType(TaskCategory type) {
        this.type = type;
    }
    
    public TaskRecurrenceRule getRecurrenceRule() {
        return recurrenceRule;
    }
    
    public void setRecurrenceRule(TaskRecurrenceRule recurrenceRule) {
        this.recurrenceRule = recurrenceRule;
    }
    
    public TaskStatus getStatus() {
        return status;
    }
    
    public void setStatus(TaskStatus status) {
        this.status = status;
    }
    
    public LocalDateTime getPlannedStartTime() {
        return plannedStartTime;
    }
    
    public void setPlannedStartTime(LocalDateTime plannedStartTime) {
        this.plannedStartTime = plannedStartTime;
    }
    
    public LocalDateTime getPlannedEndTime() {
        return plannedEndTime;
    }
    
    public void setPlannedEndTime(LocalDateTime plannedEndTime) {
        this.plannedEndTime = plannedEndTime;
    }
    
    public LocalDateTime getActualStartTime() {
        return actualStartTime;
    }
    
    public void setActualStartTime(LocalDateTime actualStartTime) {
        this.actualStartTime = actualStartTime;
    }
    
    public LocalDateTime getActualEndTime() {
        return actualEndTime;
    }
    
    public void setActualEndTime(LocalDateTime actualEndTime) {
        this.actualEndTime = actualEndTime;
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


