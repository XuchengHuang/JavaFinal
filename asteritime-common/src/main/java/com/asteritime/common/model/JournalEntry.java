package com.asteritime.common.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 日记条目
 *
 * 用于记录用户的日记内容，支持：
 *   - 标题、文本内容
 *   - 图片（多个）
 *   - 天气、心情、活动分类
 *   - 语音记录
 *   - 日期（年月日）
 *   - 每个用户每天可以有多个日记条目
 */
@Entity
@Table(name = "journal_entries")
@JsonIgnoreProperties({"user"}) // 避免序列化User对象，防止循环引用和敏感信息泄露
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
     * 日记标题
     */
    @Column(length = 255)
    private String title;
    
    /**
     * 日记文本内容
     */
    @Column(columnDefinition = "TEXT")
    private String contentText;
    
    /**
     * 图片URL列表（JSON格式存储，例如：["url1", "url2"]）
     */
    @Column(columnDefinition = "TEXT")
    private String imageUrls;
    
    /**
     * 天气（例如：晴天、雨天、多云等）
     */
    @Column(length = 50)
    private String weather;
    
    /**
     * 心情（例如：开心、难过、平静等）
     */
    @Column(length = 50)
    private String mood;
    
    /**
     * 活动（例如：工作、学习、运动等）
     */
    @Column(length = 50)
    private String activity;
    
    /**
     * 语音记录URL
     */
    @Column(length = 500)
    private String voiceNoteUrl;
    
    /**
     * 当天专注总时长（分钟）
     * 默认值为 0（保留用于统计）
     */
    @Column(nullable = false)
    private Integer totalFocusMinutes = 0;
    
    /**
     * 对这一天的评价 / 总结（可为空，保留向后兼容）
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
}


