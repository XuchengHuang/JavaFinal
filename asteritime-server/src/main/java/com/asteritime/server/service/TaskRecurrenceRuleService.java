package com.asteritime.server.service;

import com.asteritime.common.model.TaskRecurrenceRule;
import com.asteritime.common.model.User;
import com.asteritime.server.repository.TaskRecurrenceRuleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class TaskRecurrenceRuleService {

    @Autowired
    private TaskRecurrenceRuleRepository taskRecurrenceRuleRepository;
    
    @Autowired
    private com.asteritime.server.repository.UserRepository userRepository;

    /**
     * Find all recurrence rules for a specific user
     */
    public List<TaskRecurrenceRule> findAllByUserId(Long userId) {
        return taskRecurrenceRuleRepository.findByUser_Id(userId);
    }

    /**
     * Find recurrence rule by ID (validates ownership)
     */
    public Optional<TaskRecurrenceRule> findByIdAndUserId(Long id, Long userId) {
        return taskRecurrenceRuleRepository.findByIdAndUser_Id(id, userId);
    }

    /**
     * Create new recurrence rule
     * 
     * @param userId User ID
     * @param frequencyExpression Frequency expression
     * @return Created rule, or Optional.empty() if expression already exists
     */
    public Optional<TaskRecurrenceRule> create(Long userId, String frequencyExpression) {
        if (taskRecurrenceRuleRepository.findByUser_IdAndFrequencyExpression(userId, frequencyExpression).isPresent()) {
            return Optional.empty();
        }

        TaskRecurrenceRule rule = new TaskRecurrenceRule();
        rule.setFrequencyExpression(frequencyExpression);
        
        // Load user entity (Hibernate needs a managed entity, not a transient one)
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        rule.setUser(user);
        
        return Optional.of(taskRecurrenceRuleRepository.save(rule));
    }

    /**
     * Delete recurrence rule (validates ownership)
     * 
     * @param id Rule ID
     * @param userId User ID
     * @return true if deletion successful, false if rule doesn't exist or doesn't belong to user
     */
    public boolean deleteByIdAndUserId(Long id, Long userId) {
        Optional<TaskRecurrenceRule> ruleOpt = taskRecurrenceRuleRepository.findByIdAndUser_Id(id, userId);
        if (!ruleOpt.isPresent()) {
            return false;
        }
        taskRecurrenceRuleRepository.deleteById(id);
        return true;
    }
}

