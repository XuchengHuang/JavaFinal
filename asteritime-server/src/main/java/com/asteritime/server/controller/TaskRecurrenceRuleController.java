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
 * Task recurrence rule REST API endpoints
 * 
 * Note: All endpoints require Authorization header: Bearer <token>
 * userId is automatically extracted from token to ensure users can only operate their own recurrence rules
 */
@RestController
@RequestMapping("/task-recurrence-rules")
public class TaskRecurrenceRuleController {

    @Autowired
    private TaskRecurrenceRuleService taskRecurrenceRuleService;

    /**
     * Get all recurrence rules for current user
     * 
     * URL: GET /api/task-recurrence-rules
     * Header: Authorization: Bearer <token>
     * 
     * Returns: List of all recurrence rules for current user
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
     * Get recurrence rule by ID (validates ownership)
     * 
     * URL: GET /api/task-recurrence-rules/{id}
     * Header: Authorization: Bearer <token>
     * 
     * Returns: Rule with specified ID, or 404 if not found or not owned by current user
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
     * Create new recurrence rule (automatically associated with current user)
     * 
     * URL: POST /api/task-recurrence-rules
     * Header: Authorization: Bearer <token>
     * 
     * Request body example:
     *   {
     *     "frequencyExpression": "1/day"
     *   }
     * 
     * Returns 400 if frequency expression already exists for this user, otherwise creates and returns new rule
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
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(created.get());
    }

    /**
     * Delete recurrence rule (only own rules)
     * 
     * URL: DELETE /api/task-recurrence-rules/{id}
     * Header: Authorization: Bearer <token>
     * 
     * Returns 404 if rule doesn't exist or doesn't belong to current user,
     * otherwise deletes and returns 204
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

    /**
     * Request body for creating recurrence rule
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

