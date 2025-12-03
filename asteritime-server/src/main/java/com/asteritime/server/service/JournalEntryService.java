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
     * 根据用户和日期查找记录（如果不存在，返回 Optional.empty）
     */
    public Optional<JournalEntry> findByUserAndDate(Long userId, LocalDate date) {
        return journalEntryRepository.findByUserIdAndDate(userId, date);
    }

    /**
     * 获取或创建指定用户在某一天的 JournalEntry（总时长初始化为 0）。
     * 幂等：如果已存在则直接返回已有记录。
     */
    public JournalEntry getOrCreateEntry(Long userId, LocalDate date) {
        Optional<JournalEntry> optionalEntry =
                journalEntryRepository.findByUserIdAndDate(userId, date);

        if (optionalEntry.isPresent()) {
            return optionalEntry.get();
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
     * 为指定用户在某一天累加专注时间（分钟），不存在则新建。
     */
    public JournalEntry addFocusMinutes(Long userId, LocalDate date, int focusMinutes) {
        Optional<JournalEntry> optionalEntry =
                journalEntryRepository.findByUserIdAndDate(userId, date);

        JournalEntry entry = optionalEntry.orElseGet(() -> {
            JournalEntry e = new JournalEntry();
            e.setDate(date);
            e.setTotalFocusMinutes(0);

            User user = new User();
            user.setId(userId);
            e.setUser(user);

            return e;
        });

        int current = Optional.ofNullable(entry.getTotalFocusMinutes()).orElse(0);
        entry.setTotalFocusMinutes(current + focusMinutes);

        return journalEntryRepository.save(entry);
    }

    /**
     * 获取某日的专注总时长（分钟）。如果当天没有记录，则返回 0。
     */
    public int getTotalFocusMinutes(Long userId, LocalDate date) {
        return journalEntryRepository.findByUserIdAndDate(userId, date)
                .map(e -> Optional.ofNullable(e.getTotalFocusMinutes()).orElse(0))
                .orElse(0);
    }

    /**
     * 更新（或新增）某天的评价文本。
     * 如果记录不存在，则创建一条 totalFocusMinutes=0 且带有 evaluation 的记录。
     */
    public JournalEntry upsertEvaluation(Long userId, LocalDate date, String evaluation) {
        JournalEntry entry = getOrCreateEntry(userId, date);
        entry.setEvaluation(evaluation);
        return journalEntryRepository.save(entry);
    }

    /**
     * 获取指定用户的所有日志（按日期倒序排列，最新的在前）
     */
    public List<JournalEntry> findAllByUserId(Long userId) {
        return journalEntryRepository.findByUser_IdOrderByDateDesc(userId);
    }
}


