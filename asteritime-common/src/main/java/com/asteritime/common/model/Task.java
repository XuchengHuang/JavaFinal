package com.asteritime.common.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import javax.persistence.*;
import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import java.time.LocalDateTime;

/**
 * Task entity
 */
@Entity
@Table(name = "tasks")
@JsonIgnoreProperties({"user"}) // Avoid serializing User object to prevent circular references and sensitive info leaks
public class Task {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    private String description;
    
    /**
     * Quadrant: 1=Urgent/Important, 2=NotUrgent/Important,
     *           3=Urgent/NotImportant, 4=NotUrgent/NotImportant
     */
    @Min(1)
    @Max(4)
    @Column(nullable = false)
    private Integer quadrant;
    
    /**
     * Task type (foreign key, references task category)
     */
    @ManyToOne
    @JoinColumn(name = "category_id")
    private TaskCategory type;
    
    /**
     * Recurrence rule (foreign key, references task recurrence frequency rule)
     */
    @ManyToOne
    @JoinColumn(name = "recurrence_rule_id")
    private TaskRecurrenceRule recurrenceRule;
    
    /**
     * Task status:
     *   DELAY  - Delayed
     *   TODO   - To do
     *   DOING  - In progress
     *   DONE   - Done
     *   CANCEL - Cancelled
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status;
    
    /**
     * Planned start time
     */
    private LocalDateTime plannedStartTime;
    
    /**
     * Planned end time
     */
    private LocalDateTime plannedEndTime;
    
    /**
     * Actual start time
     */
    private LocalDateTime actualStartTime;
    
    /**
     * Actual end time
     */
    private LocalDateTime actualEndTime;
    
    /**
     * Optimistic lock version (for concurrency control)
     * Auto-increments on each update to prevent concurrent update conflicts
     */
    @Version
    @Column(nullable = false)
    private Long version;
    
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
     * Owner user (foreign key to users table)
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
    
    public Long getVersion() {
        return version;
    }
    
    public void setVersion(Long version) {
        this.version = version;
    }
}


