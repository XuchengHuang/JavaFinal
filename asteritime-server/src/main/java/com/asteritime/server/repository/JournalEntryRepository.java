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
     * Find all journal entries for a user on a specific date (ordered by creation time desc, newest first)
     */
    List<JournalEntry> findByUser_IdAndDateOrderByCreatedAtDesc(Long userId, LocalDate date);
    
    /**
     * Find all journal entries for a user (ordered by date desc, newest first)
     */
    @Query("SELECT e FROM JournalEntry e WHERE e.user.id = :userId ORDER BY e.date DESC, e.createdAt DESC")
    List<JournalEntry> findByUser_IdOrderByDateDescCreatedAtDesc(@Param("userId") Long userId);
    
    /**
     * Find all journal entries for a user within a date range (ordered by date desc, newest first)
     */
    @Query("SELECT e FROM JournalEntry e WHERE e.user.id = :userId AND e.date BETWEEN :startDate AND :endDate ORDER BY e.date DESC, e.createdAt DESC")
    List<JournalEntry> findByUser_IdAndDateBetweenOrderByDateDescCreatedAtDesc(
            @Param("userId") Long userId, 
            @Param("startDate") LocalDate startDate, 
            @Param("endDate") LocalDate endDate);
    
    /**
     * Find journal entry by ID and load User object (avoids lazy loading exception)
     */
    @Query("SELECT e FROM JournalEntry e JOIN FETCH e.user WHERE e.id = :id")
    Optional<JournalEntry> findByIdWithUser(@Param("id") Long id);
}


