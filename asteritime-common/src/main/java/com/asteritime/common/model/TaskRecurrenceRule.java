package com.asteritime.common.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * Task recurrence frequency rule
 *
 * Note:
 *   - Currently only contains: rule ID + frequency expression
 *   - Frequency expression can be readable string, e.g.:
 *       "1/day"   -> once per day
 *       "2/day"   -> twice per day
 *       "1/week"  -> once per week
 *   - For future support of more complex customization (e.g., specific time, day of week):
 *       1) Define richer expression format, or
 *       2) Split into multiple fields (unit, interval, times per day, specific time, etc.)
 */
@Entity
@Table(
    name = "task_recurrence_rules",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "frequency_expression"})
    }
)
@JsonIgnoreProperties({"user"}) // Avoid serializing User object to prevent circular references and sensitive info leaks
public class TaskRecurrenceRule {

    /**
     * Rule ID (primary key)
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Owner user (foreign key to users table)
     */
    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Recurrence frequency expression (unique per user)
     *
     * Examples:
     *   - "1/day"  -> once per day
     *   - "2/day"  -> twice per day
     */
    @Column(name = "frequency_expression", nullable = false)
    private String frequencyExpression;

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
    
    public Long getVersion() {
        return version;
    }
    
    public void setVersion(Long version) {
        this.version = version;
    }
}


