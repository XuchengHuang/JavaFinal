package com.asteritime.server.repository;

import com.asteritime.common.model.TaskRecurrenceRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRecurrenceRuleRepository extends JpaRepository<TaskRecurrenceRule, Long> {
    
    /**
     * 查询指定用户的所有重复规则
     */
    List<TaskRecurrenceRule> findByUser_Id(Long userId);
    
    /**
     * 查询指定用户的指定重复规则（用于检查重复）
     */
    Optional<TaskRecurrenceRule> findByUser_IdAndFrequencyExpression(Long userId, String frequencyExpression);
    
    /**
     * 查询指定用户的指定重复规则（按ID）
     */
    Optional<TaskRecurrenceRule> findByIdAndUser_Id(Long id, Long userId);
}

