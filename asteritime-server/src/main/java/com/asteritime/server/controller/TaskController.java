package com.asteritime.server.controller;

import com.asteritime.common.model.Task;
import com.asteritime.common.model.TaskStatus;
import com.asteritime.common.model.User;
import com.asteritime.server.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Task REST API endpoints
 * 
 * Features:
 *   - Query tasks (all tasks / single task)
 *   - Create task
 *   - Update task
 *   - Delete task
 * 
 * Note: All endpoints require Authorization header: Bearer <token>
 * userId is automatically extracted from token to ensure users can only operate their own tasks
 */
@RestController
@RequestMapping("/tasks")
public class TaskController {
    
    @Autowired
    private TaskService taskService;
    
    /**
     * Get tasks for current user (supports multiple query conditions)
     * 
     * URL: GET /api/tasks
     * Header: Authorization: Bearer <token>
     * 
     * Query parameters (all optional, can be combined):
     *   - quadrant: Quadrant (1-4)
     *   - categoryId: Category ID
     *   - status: Status (DELAY, TODO, DOING, DONE, CANCEL)
     *   - startTime: Start time (ISO 8601 format, e.g., 2025-12-06T00:00:00)
     *   - endTime: End time (ISO 8601 format, e.g., 2025-12-06T23:59:59)
     * 
     * Examples:
     *   GET /api/tasks                                    -> All tasks
     *   GET /api/tasks?quadrant=1                        -> Quadrant 1 tasks
     *   GET /api/tasks?categoryId=2                      -> Category ID 2 tasks
     *   GET /api/tasks?status=TODO                       -> TODO status tasks
     *   GET /api/tasks?quadrant=1&categoryId=2           -> Quadrant 1 and category 2 tasks
     *   GET /api/tasks?quadrant=1&status=DOING           -> Quadrant 1 and DOING status tasks
     *   GET /api/tasks?categoryId=2&status=TODO          -> Category 2 and TODO status tasks
     *   GET /api/tasks?startTime=2025-12-06T00:00:00&endTime=2025-12-06T23:59:59  -> Tasks for a specific day
     *   GET /api/tasks?status=TODO&startTime=...&endTime=...  -> TODO status tasks within time range
     *   GET /api/tasks?quadrant=1&status=DOING&startTime=...&endTime=...  -> Quadrant 1 + DOING + time range
     * 
     * Returns: List of matching tasks (ordered by creation time desc)
     */
    @GetMapping
    public ResponseEntity<List<Task>> getTasks(
            HttpServletRequest request,
            @RequestParam(required = false) Integer quadrant,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime) {
        
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        if (quadrant != null && (quadrant < 1 || quadrant > 4)) {
            return ResponseEntity.badRequest().build();
        }
        
        if (status != null && !status.isEmpty()) {
            try {
                TaskStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        }
        
        LocalDateTime startDateTime = null;
        LocalDateTime endDateTime = null;
        try {
            if (startTime != null && !startTime.isEmpty()) {
                startDateTime = LocalDateTime.parse(startTime);
            }
            if (endTime != null && !endTime.isEmpty()) {
                endDateTime = LocalDateTime.parse(endTime);
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
        
        if ((startDateTime != null && endDateTime == null) || 
            (startDateTime == null && endDateTime != null)) {
            return ResponseEntity.badRequest().build();
        }
        
        List<Task> tasks = taskService.findByConditions(
                userId, quadrant, categoryId, status, startDateTime, endDateTime);
        return ResponseEntity.ok(tasks);
    }
    
    /**
     * Get specific task for current user
     * 
     * URL: GET /api/tasks/{id}
     * Header: Authorization: Bearer <token>
     * 
     * Returns: Task with specified ID, or 404 if not found or not owned by current user
     */
    @GetMapping("/{id}")
    public ResponseEntity<Task> getTask(HttpServletRequest request, @PathVariable Long id) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return taskService.findByIdAndUserId(id, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Create task (automatically associated with current user)
     * 
     * URL: POST /api/tasks
     * Header: Authorization: Bearer <token>
     * 
     * Request body example:
     *   {
     *     "title": "Complete project report",
     *     "description": "Need to complete this week's project summary report",
     *     "quadrant": 1,
     *     "type": { "id": 1 },
     *     "recurrenceRule": { "id": 1 },
     *     "status": "TODO",
     *     "plannedStartTime": "2025-12-06T09:00:00",
     *     "plannedEndTime": "2025-12-06T17:00:00"
     *   }
     * 
     * Note:
     *   - userId is automatically extracted from token, no need to pass in request body
     *   - type and recurrenceRule only need to pass id (if associated)
     * 
     * Returns: Created task object (201 Created)
     */
    @PostMapping
    public ResponseEntity<Task> createTask(HttpServletRequest request, @RequestBody Task task) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        User user = new User();
        user.setId(userId);
        task.setUser(user);
        
        Task created = taskService.save(task);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    /**
     * Update task (only own tasks)
     * 
     * URL: PUT /api/tasks/{id}
     * Header: Authorization: Bearer <token>
     * 
     * Request body example:
     *   {
     *     "title": "Complete project report (modified)",
     *     "description": "Need to complete this week's project summary report and add charts",
     *     "quadrant": 1,
     *     "status": "DOING",
     *     "plannedStartTime": "2025-12-06T09:00:00",
     *     "plannedEndTime": "2025-12-06T18:00:00"
     *   }
     * 
     * Note:
     *   - id in request body will be overridden by path parameter
     *   - userId is automatically extracted from token to ensure only own tasks can be updated
     *   - Returns 404 if task doesn't exist or doesn't belong to current user
     * 
     * Returns: Updated task object
     */
    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(HttpServletRequest request, 
                                          @PathVariable Long id, 
                                          @RequestBody Task task) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        try {
            Task updated = taskService.updateTask(id, userId, task);
            return ResponseEntity.ok(updated);
        } catch (OptimisticLockingFailureException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .header("X-Error-Message", "Task has been modified by another operation, please refresh and retry")
                    .build();
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.badRequest().body(null);
        } catch (RuntimeException e) {
            if (e.getMessage() != null && (e.getMessage().contains("TODO task") || e.getMessage().contains("DOING task"))) {
                return ResponseEntity.badRequest().body(null);
            }
            if (e.getMessage() != null && e.getMessage().contains("cannot be null")) {
                return ResponseEntity.badRequest().body(null);
            }
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Delete task (only own tasks)
     * 
     * URL: DELETE /api/tasks/{id}
     * Header: Authorization: Bearer <token>
     * 
     * Returns 404 if task doesn't exist or doesn't belong to current user,
     * otherwise deletes and returns 204 No Content
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(HttpServletRequest request, @PathVariable Long id) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        if (taskService.deleteByIdAndUserId(id, userId)) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}


