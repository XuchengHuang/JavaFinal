package com.asteritime.server.repository;

import com.asteritime.common.model.TaskRecurrenceRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRecurrenceRuleRepository extends JpaRepository<TaskRecurrenceRule, Long> {
    
    /**
     * Find all recurrence rules for a specific user
     */
    List<TaskRecurrenceRule> findByUser_Id(Long userId);
    
    /**
     * Find specific recurrence rule for a specific user (for duplicate checking)
     */
    Optional<TaskRecurrenceRule> findByUser_IdAndFrequencyExpression(Long userId, String frequencyExpression);
    
    /**
     * Find specific recurrence rule for a specific user (by ID)
     */
    Optional<TaskRecurrenceRule> findByIdAndUser_Id(Long id, Long userId);
}

