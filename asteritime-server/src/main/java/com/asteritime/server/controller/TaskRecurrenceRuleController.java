package com.asteritime.server.controller;

import com.asteritime.common.model.TaskRecurrenceRule;
import com.asteritime.server.service.TaskRecurrenceRuleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Optional;

/**
 * 任务重复规则相关接口
 * 
 * 注意：所有接口都需要在 Header 中携带 token：Authorization: Bearer <token>
 * userId 会自动从 token 中提取，确保用户只能操作自己的重复规则
 */
@RestController
@RequestMapping("/task-recurrence-rules")
public class TaskRecurrenceRuleController {

    @Autowired
    private TaskRecurrenceRuleService taskRecurrenceRuleService;

    /**
     * 查询当前用户的所有重复规则
     * 
     * URL:
     *   GET /api/task-recurrence-rules
     *   Header: Authorization: Bearer <token>
     * 
     * 返回：当前用户的所有重复规则列表
     */
    @GetMapping
    public ResponseEntity<List<TaskRecurrenceRule>> getAllRules(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(taskRecurrenceRuleService.findAllByUserId(userId));
    }

    /**
     * 根据 ID 查询重复规则（验证属于当前用户）
     * 
     * URL:
     *   GET /api/task-recurrence-rules/{id}
     *   Header: Authorization: Bearer <token>
     * 
     * 返回：指定 ID 的规则，如果不存在或不属于当前用户则返回 404
     */
    @GetMapping("/{id}")
    public ResponseEntity<TaskRecurrenceRule> getRule(HttpServletRequest request, @PathVariable Long id) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return taskRecurrenceRuleService.findByIdAndUserId(id, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 创建新重复规则（自动关联到当前用户）
     * 
     * URL:
     *   POST /api/task-recurrence-rules
     *   Header: Authorization: Bearer <token>
     * 
     * 请求体示例：
     *   {
     *     "frequencyExpression": "1/day"
     *   }
     * 
     * 逻辑：
     *   - 如果该用户下频率表达式已存在，返回 400
     *   - 否则创建新规则并返回
     */
    @PostMapping
    public ResponseEntity<TaskRecurrenceRule> createRule(HttpServletRequest request,
                                                         @RequestBody CreateRuleRequest requestBody) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        if (requestBody.getFrequencyExpression() == null || requestBody.getFrequencyExpression().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Optional<TaskRecurrenceRule> created = taskRecurrenceRuleService.create(
                userId, 
                requestBody.getFrequencyExpression().trim()
        );
        if (!created.isPresent()) {
            // 表达式已存在
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(created.get());
    }

    /**
     * 删除重复规则（只能删除自己的规则）
     * 
     * URL:
     *   DELETE /api/task-recurrence-rules/{id}
     *   Header: Authorization: Bearer <token>
     * 
     * 逻辑：
     *   - 如果规则不存在或不属于当前用户，返回 404
     *   - 否则删除并返回 204
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRule(HttpServletRequest request, @PathVariable Long id) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        if (taskRecurrenceRuleService.deleteByIdAndUserId(id, userId)) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // ====== DTO ======

    /**
     * 用于接收创建重复规则的请求体
     */
    public static class CreateRuleRequest {
        private String frequencyExpression;

        public String getFrequencyExpression() {
            return frequencyExpression;
        }

        public void setFrequencyExpression(String frequencyExpression) {
            this.frequencyExpression = frequencyExpression;
        }
    }
}

