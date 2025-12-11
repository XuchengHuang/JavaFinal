package com.asteritime.server.repository;

import com.asteritime.common.model.JournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {
    
    /**
     * 查找某个用户在某一天的所有日记条目（按创建时间倒序排列，最新的在前）
     */
    List<JournalEntry> findByUser_IdAndDateOrderByCreatedAtDesc(Long userId, LocalDate date);
    
    /**
     * 查找某个用户的所有日志（按日期倒序排列，最新的在前）
     */
    @Query("SELECT e FROM JournalEntry e WHERE e.user.id = :userId ORDER BY e.date DESC, e.createdAt DESC")
    List<JournalEntry> findByUser_IdOrderByDateDescCreatedAtDesc(@Param("userId") Long userId);
    
    /**
     * 查找某个用户在日期范围内的所有日志（按日期倒序排列，最新的在前）
     */
    @Query("SELECT e FROM JournalEntry e WHERE e.user.id = :userId AND e.date BETWEEN :startDate AND :endDate ORDER BY e.date DESC, e.createdAt DESC")
    List<JournalEntry> findByUser_IdAndDateBetweenOrderByDateDescCreatedAtDesc(
            @Param("userId") Long userId, 
            @Param("startDate") LocalDate startDate, 
            @Param("endDate") LocalDate endDate);
    
    /**
     * 根据ID查找日记条目，并加载User对象（避免懒加载异常）
     */
    @Query("SELECT e FROM JournalEntry e JOIN FETCH e.user WHERE e.id = :id")
    Optional<JournalEntry> findByIdWithUser(@Param("id") Long id);
}


