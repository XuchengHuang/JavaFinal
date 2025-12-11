package com.asteritime.server.service;

import com.asteritime.common.model.JournalEntry;
import com.asteritime.common.model.User;
import com.asteritime.server.repository.JournalEntryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class JournalEntryService {

    @Autowired
    private JournalEntryRepository journalEntryRepository;

    /**
     * 创建新的日记条目
     */
    public JournalEntry createJournalEntry(Long userId, JournalEntry journalEntry) {
        User user = new User();
        user.setId(userId);
        journalEntry.setUser(user);
        
        if (journalEntry.getDate() == null) {
            journalEntry.setDate(LocalDate.now());
        }
        
        if (journalEntry.getTotalFocusMinutes() == null) {
            journalEntry.setTotalFocusMinutes(0);
        }
        
        return journalEntryRepository.save(journalEntry);
    }

    /**
     * 根据ID获取日记条目
     */
    public Optional<JournalEntry> findById(Long id) {
        // 使用带User的查询，避免懒加载异常
        return journalEntryRepository.findByIdWithUser(id);
    }

    /**
     * 根据用户和日期查找该天的所有日记条目（按创建时间倒序）
     */
    public List<JournalEntry> findByUserAndDate(Long userId, LocalDate date) {
        return journalEntryRepository.findByUser_IdAndDateOrderByCreatedAtDesc(userId, date);
    }

    /**
     * 获取指定用户的所有日志（按日期倒序排列，最新的在前）
     */
    public List<JournalEntry> findAllByUserId(Long userId) {
        return journalEntryRepository.findByUser_IdOrderByDateDescCreatedAtDesc(userId);
    }

    /**
     * 获取指定用户在日期范围内的所有日志
     */
    public List<JournalEntry> findByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate) {
        return journalEntryRepository.findByUser_IdAndDateBetweenOrderByDateDescCreatedAtDesc(
                userId, startDate, endDate);
    }

    /**
     * 更新日记条目（只能更新自己的日记）
     */
    public Optional<JournalEntry> updateJournalEntry(Long userId, Long entryId, JournalEntry updatedEntry) {
        try {
            // 使用带User的查询，避免懒加载异常
            Optional<JournalEntry> optionalEntry = journalEntryRepository.findByIdWithUser(entryId);
            
            if (!optionalEntry.isPresent()) {
                System.out.println("未找到日记条目: " + entryId);
                return Optional.empty();
            }
            
            JournalEntry entry = optionalEntry.get();
            System.out.println("找到日记条目: " + entry.getId() + ", User: " + (entry.getUser() != null ? entry.getUser().getId() : "null"));
            
            // 验证是否是自己的日记
            if (entry.getUser() == null) {
                System.err.println("日记条目缺少用户信息: " + entryId);
                throw new IllegalStateException("日记条目缺少用户信息");
            }
            if (!entry.getUser().getId().equals(userId)) {
                System.err.println("用户ID不匹配 - 请求用户: " + userId + ", 日记所有者: " + entry.getUser().getId());
                throw new IllegalArgumentException("无权修改他人的日记");
            }
            
            // 更新字段
            // 如果字段不为null，则更新（空字符串会被转换为null来清空字段）
            if (updatedEntry.getTitle() != null) {
                String title = updatedEntry.getTitle().trim();
                entry.setTitle(title.isEmpty() ? null : title);
            }
            if (updatedEntry.getContentText() != null) {
                String contentText = updatedEntry.getContentText().trim();
                entry.setContentText(contentText.isEmpty() ? null : contentText);
            }
            if (updatedEntry.getImageUrls() != null) {
                String imageUrls = updatedEntry.getImageUrls().trim();
                entry.setImageUrls(imageUrls.isEmpty() ? null : imageUrls);
            }
            if (updatedEntry.getWeather() != null) {
                String weather = updatedEntry.getWeather().trim();
                entry.setWeather(weather.isEmpty() ? null : weather);
            }
            if (updatedEntry.getMood() != null) {
                String mood = updatedEntry.getMood().trim();
                entry.setMood(mood.isEmpty() ? null : mood);
            }
            if (updatedEntry.getActivity() != null) {
                String activity = updatedEntry.getActivity().trim();
                entry.setActivity(activity.isEmpty() ? null : activity);
            }
            if (updatedEntry.getVoiceNoteUrl() != null) {
                String voiceNoteUrl = updatedEntry.getVoiceNoteUrl().trim();
                entry.setVoiceNoteUrl(voiceNoteUrl.isEmpty() ? null : voiceNoteUrl);
            }
            if (updatedEntry.getEvaluation() != null) {
                String evaluation = updatedEntry.getEvaluation().trim();
                entry.setEvaluation(evaluation.isEmpty() ? null : evaluation);
            }
            if (updatedEntry.getDate() != null) {
                entry.setDate(updatedEntry.getDate());
            }
            if (updatedEntry.getTotalFocusMinutes() != null) {
                entry.setTotalFocusMinutes(updatedEntry.getTotalFocusMinutes());
            }
            
            System.out.println("准备保存日记条目: " + entry.getId());
            JournalEntry saved = journalEntryRepository.save(entry);
            System.out.println("保存成功: " + saved.getId());
            return Optional.of(saved);
            
        } catch (IllegalArgumentException | IllegalStateException e) {
            // 重新抛出业务异常
            throw e;
        } catch (Exception e) {
            System.err.println("更新日记条目时发生未知错误: " + e.getMessage());
            System.err.println("异常类型: " + e.getClass().getName());
            e.printStackTrace();
            throw new RuntimeException("更新日记失败: " + e.getMessage(), e);
        }
    }

    /**
     * 删除日记条目（只能删除自己的日记）
     */
    public boolean deleteJournalEntry(Long userId, Long entryId) {
        Optional<JournalEntry> optionalEntry = journalEntryRepository.findById(entryId);
        
        if (!optionalEntry.isPresent()) {
            return false;
        }
        
        JournalEntry entry = optionalEntry.get();
        
        // 验证是否是自己的日记
        if (!entry.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("无权删除他人的日记");
        }
        
        journalEntryRepository.delete(entry);
        return true;
    }

    // ========== 以下方法保留用于向后兼容和统计功能 ==========

    /**
     * 获取或创建指定用户在某一天的 JournalEntry（总时长初始化为 0）。
     * 注意：现在一天可以有多个journal，此方法会返回该天第一个创建的条目，或创建新条目
     */
    public JournalEntry getOrCreateEntry(Long userId, LocalDate date) {
        List<JournalEntry> entries = journalEntryRepository.findByUser_IdAndDateOrderByCreatedAtDesc(userId, date);
        
        if (!entries.isEmpty()) {
            return entries.get(entries.size() - 1); // 返回最早创建的
        }

        JournalEntry entry = new JournalEntry();
        entry.setDate(date);
        entry.setTotalFocusMinutes(0);

        User user = new User();
        user.setId(userId);
        entry.setUser(user);

        return journalEntryRepository.save(entry);
    }

    /**
     * 为指定用户在某一天累加专注时间（分钟）。
     * 注意：只累加到已存在的日记条目上，如果该天没有日记条目，则不创建新条目
     * 这样可以避免因为使用番茄钟而自动创建空的日记条目
     */
    public JournalEntry addFocusMinutes(Long userId, LocalDate date, int focusMinutes) {
        List<JournalEntry> entries = journalEntryRepository.findByUser_IdAndDateOrderByCreatedAtDesc(userId, date);

        // 如果该天没有日记条目，不创建新条目，返回null或创建一个最小化的统计记录
        // 但为了向后兼容，我们创建一个只有totalFocusMinutes的记录，不包含其他内容
        // 前端可以通过检查是否有title/contentText等字段来判断是否是自动创建的统计记录
        JournalEntry entry;
        if (entries.isEmpty()) {
            // 不创建新条目，专注时间统计可以通过其他方式记录
            // 或者创建一个标记为"统计记录"的条目
            entry = new JournalEntry();
            entry.setDate(date);
            entry.setTotalFocusMinutes(focusMinutes);
            // 不设置title、contentText等字段，这样前端可以识别这是自动创建的统计记录

            User user = new User();
            user.setId(userId);
            entry.setUser(user);
            
            // 保存这个统计记录
            return journalEntryRepository.save(entry);
        } else {
            // 累加到最早创建的条目上
            entry = entries.get(entries.size() - 1);
            int current = Optional.ofNullable(entry.getTotalFocusMinutes()).orElse(0);
            entry.setTotalFocusMinutes(current + focusMinutes);
            return journalEntryRepository.save(entry);
        }
    }

    /**
     * 获取某日的专注总时长（分钟）。计算该天所有日记条目的总时长之和。
     */
    public int getTotalFocusMinutes(Long userId, LocalDate date) {
        List<JournalEntry> entries = journalEntryRepository.findByUser_IdAndDateOrderByCreatedAtDesc(userId, date);
        return entries.stream()
                .mapToInt(e -> Optional.ofNullable(e.getTotalFocusMinutes()).orElse(0))
                .sum();
    }

    /**
     * 更新（或新增）某天的评价文本。
     * 注意：此方法会更新到该天最早创建的条目上，或创建新条目
     */
    public JournalEntry upsertEvaluation(Long userId, LocalDate date, String evaluation) {
        JournalEntry entry = getOrCreateEntry(userId, date);
        entry.setEvaluation(evaluation);
        return journalEntryRepository.save(entry);
    }
}


