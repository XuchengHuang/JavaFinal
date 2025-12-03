package com.asteritime.server.repository;

import com.asteritime.common.model.JournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {
    
    /**
     * 查找某个用户在某一天的总结（每天最多一条）
     */
    Optional<JournalEntry> findByUserIdAndDate(Long userId, LocalDate date);
    
    /**
     * 查找某个用户的所有日志（按日期倒序排列，最新的在前）
     */
    java.util.List<JournalEntry> findByUser_IdOrderByDateDesc(Long userId);
}


