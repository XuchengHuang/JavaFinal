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

    /**
     * 查询指定用户的所有重复规则
     */
    public List<TaskRecurrenceRule> findAllByUserId(Long userId) {
        return taskRecurrenceRuleRepository.findByUser_Id(userId);
    }

    /**
     * 根据 ID 查询重复规则（验证属于指定用户）
     */
    public Optional<TaskRecurrenceRule> findByIdAndUserId(Long id, Long userId) {
        return taskRecurrenceRuleRepository.findByIdAndUser_Id(id, userId);
    }

    /**
     * 创建新重复规则
     * 
     * @param userId 用户ID
     * @param frequencyExpression 频率表达式
     * @return 创建成功的规则，如果表达式已存在则返回 Optional.empty()
     */
    public Optional<TaskRecurrenceRule> create(Long userId, String frequencyExpression) {
        // 检查该用户下表达式是否已存在
        if (taskRecurrenceRuleRepository.findByUser_IdAndFrequencyExpression(userId, frequencyExpression).isPresent()) {
            return Optional.empty();
        }

        TaskRecurrenceRule rule = new TaskRecurrenceRule();
        rule.setFrequencyExpression(frequencyExpression);
        
        User user = new User();
        user.setId(userId);
        rule.setUser(user);
        
        return Optional.of(taskRecurrenceRuleRepository.save(rule));
    }

    /**
     * 删除重复规则（验证属于指定用户）
     * 
     * @param id 规则 ID
     * @param userId 用户ID
     * @return true 如果删除成功，false 如果规则不存在或不属于该用户
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

