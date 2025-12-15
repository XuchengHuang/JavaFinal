package com.asteritime.common.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Journal entry
 *
 * Used to record user's journal content, supports:
 *   - Title, text content
 *   - Images (multiple)
 *   - Weather, mood, activity classification
 *   - Voice notes
 *   - Date (year-month-day)
 *   - Multiple entries per user per day allowed
 */
@Entity
@Table(name = "journal_entries")
@JsonIgnoreProperties({"user"}) // Avoid serializing User object to prevent circular references and sensitive info leaks
public class JournalEntry {
    
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
     * Date (year-month-day only)
     */
    @Column(nullable = false)
    private LocalDate date;
    
    /**
     * Journal title
     */
    @Column(length = 255)
    private String title;
    
    /**
     * Journal text content
     */
    @Column(columnDefinition = "TEXT")
    private String contentText;
    
    /**
     * Image URL list (stored as JSON, e.g., ["url1", "url2"])
     */
    @Column(columnDefinition = "TEXT")
    private String imageUrls;
    
    /**
     * Weather (e.g., Sunny, Rainy, Cloudy)
     */
    @Column(length = 50)
    private String weather;
    
    /**
     * Mood (e.g., Happy, Sad, Calm)
     */
    @Column(length = 50)
    private String mood;
    
    /**
     * Activity (e.g., Work, Study, Exercise)
     */
    @Column(length = 50)
    private String activity;
    
    /**
     * Voice note URL
     */
    @Column(length = 500)
    private String voiceNoteUrl;
    
    /**
     * Total focus minutes for the day
     * Default value is 0 (reserved for statistics)
     */
    @Column(nullable = false)
    private Integer totalFocusMinutes = 0;
    
    /**
     * Evaluation/summary for the day (can be null, kept for backward compatibility)
     */
    @Column(columnDefinition = "TEXT")
    private String evaluation;
    
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
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getContentText() {
        return contentText;
    }
    
    public void setContentText(String contentText) {
        this.contentText = contentText;
    }
    
    public String getImageUrls() {
        return imageUrls;
    }
    
    public void setImageUrls(String imageUrls) {
        this.imageUrls = imageUrls;
    }
    
    public String getWeather() {
        return weather;
    }
    
    public void setWeather(String weather) {
        this.weather = weather;
    }
    
    public String getMood() {
        return mood;
    }
    
    public void setMood(String mood) {
        this.mood = mood;
    }
    
    public String getActivity() {
        return activity;
    }
    
    public void setActivity(String activity) {
        this.activity = activity;
    }
    
    public String getVoiceNoteUrl() {
        return voiceNoteUrl;
    }
    
    public void setVoiceNoteUrl(String voiceNoteUrl) {
        this.voiceNoteUrl = voiceNoteUrl;
    }
    
    public Long getVersion() {
        return version;
    }
    
    public void setVersion(Long version) {
        this.version = version;
    }
}


