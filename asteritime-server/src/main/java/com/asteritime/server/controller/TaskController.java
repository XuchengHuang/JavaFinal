package com.asteritime.server.controller;

import com.asteritime.common.model.Task;
import com.asteritime.common.model.TaskStatus;
import com.asteritime.common.model.User;
import com.asteritime.server.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 任务相关接口
 * 
 * 功能：
 *   - 查询任务（所有任务 / 单个任务）
 *   - 创建任务
 *   - 更新任务
 *   - 删除任务
 * 
 * 注意：所有接口都需要在 Header 中携带 token：Authorization: Bearer <token>
 * userId 会自动从 token 中提取，确保用户只能操作自己的任务
 */
@RestController
@RequestMapping("/tasks")
public class TaskController {
    
    @Autowired
    private TaskService taskService;
    
    /**
     * 获取当前用户的任务（支持多种查询条件）
     * 
     * URL:
     *   GET /api/tasks
     *   Header: Authorization: Bearer <token>
     * 
     * 查询参数（全部可选，可组合使用）：
     *   - quadrant: 四象限（1-4）
     *   - categoryId: 类别ID
     *   - status: 状态（DELAY, TODO, DOING, DONE, CANCEL）
     *   - startTime: 开始时间（ISO 8601 格式，如：2025-12-06T00:00:00）
     *   - endTime: 结束时间（ISO 8601 格式，如：2025-12-06T23:59:59）
     * 
     * 示例：
     *   GET /api/tasks                                    -> 所有任务
     *   GET /api/tasks?quadrant=1                        -> 第一象限的任务
     *   GET /api/tasks?categoryId=2                      -> 类别ID为2的任务
     *   GET /api/tasks?status=TODO                       -> 状态为TODO的任务
     *   GET /api/tasks?quadrant=1&categoryId=2           -> 第一象限且类别为2的任务
     *   GET /api/tasks?quadrant=1&status=DOING           -> 第一象限且状态为DOING的任务
     *   GET /api/tasks?categoryId=2&status=TODO          -> 类别为2且状态为TODO的任务
     *   GET /api/tasks?startTime=2025-12-06T00:00:00&endTime=2025-12-06T23:59:59  -> 某一天的任务
     *   GET /api/tasks?status=TODO&startTime=...&endTime=...  -> 状态为TODO且某时间范围的任务
     *   GET /api/tasks?quadrant=1&status=DOING&startTime=...&endTime=...  -> 第一象限+DOING状态+时间范围
     * 
     * 返回：符合条件的任务列表（按创建时间倒序）
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
        
        // 验证四象限范围
        if (quadrant != null && (quadrant < 1 || quadrant > 4)) {
            return ResponseEntity.badRequest().build();
        }
        
        // 验证状态值
        if (status != null && !status.isEmpty()) {
            try {
                TaskStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        }
        
        // 解析时间参数
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
        
        // 如果只提供了开始时间或结束时间，返回错误
        if ((startDateTime != null && endDateTime == null) || 
            (startDateTime == null && endDateTime != null)) {
            return ResponseEntity.badRequest().build();
        }
        
        List<Task> tasks = taskService.findByConditions(
                userId, quadrant, categoryId, status, startDateTime, endDateTime);
        return ResponseEntity.ok(tasks);
    }
    
    /**
     * 获取当前用户的指定任务
     * 
     * URL:
     *   GET /api/tasks/{id}
     *   Header: Authorization: Bearer <token>
     * 
     * 返回：指定 ID 的任务，如果不存在或不属于当前用户则返回 404
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
     * 创建任务（自动关联到当前用户）
     * 
     * URL:
     *   POST /api/tasks
     *   Header: Authorization: Bearer <token>
     * 
     * 请求体示例：
     *   {
     *     "title": "完成项目报告",
     *     "description": "需要完成本周的项目总结报告",
     *     "quadrant": 1,
     *     "type": { "id": 1 },
     *     "recurrenceRule": { "id": 1 },
     *     "status": "TODO",
     *     "plannedStartTime": "2025-12-06T09:00:00",
     *     "plannedEndTime": "2025-12-06T17:00:00"
     *   }
     * 
     * 注意：
     *   - userId 会自动从 token 中获取，无需在请求体中传递
     *   - type 和 recurrenceRule 只需要传递 id 即可（如果有关联）
     * 
     * 返回：创建成功的任务对象（201 Created）
     */
    @PostMapping
    public ResponseEntity<Task> createTask(HttpServletRequest request, @RequestBody Task task) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        // 确保任务关联到当前用户
        User user = new User();
        user.setId(userId);
        task.setUser(user);
        
        Task created = taskService.save(task);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    /**
     * 更新任务（只能更新自己的任务）
     * 
     * URL:
     *   PUT /api/tasks/{id}
     *   Header: Authorization: Bearer <token>
     * 
     * 请求体示例：
     *   {
     *     "title": "完成项目报告（已修改）",
     *     "description": "需要完成本周的项目总结报告，并添加图表",
     *     "quadrant": 1,
     *     "status": "DOING",
     *     "plannedStartTime": "2025-12-06T09:00:00",
     *     "plannedEndTime": "2025-12-06T18:00:00"
     *   }
     * 
     * 注意：
     *   - 请求体中的 id 会被路径参数覆盖
     *   - userId 会自动从 token 中获取，确保只能更新自己的任务
     *   - 如果任务不存在或不属于当前用户，返回 404
     * 
     * 返回：更新后的任务对象
     */
    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(HttpServletRequest request, 
                                          @PathVariable Long id, 
                                          @RequestBody Task task) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        // 验证任务是否属于当前用户
        if (!taskService.findByIdAndUserId(id, userId).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        task.setId(id);
        // 确保用户关联正确
        User user = new User();
        user.setId(userId);
        task.setUser(user);
        
        Task updated = taskService.save(task);
        return ResponseEntity.ok(updated);
    }
    
    /**
     * 删除任务（只能删除自己的任务）
     * 
     * URL:
     *   DELETE /api/tasks/{id}
     *   Header: Authorization: Bearer <token>
     * 
     * 逻辑：
     *   - 如果任务不存在或不属于当前用户，返回 404
     *   - 否则删除并返回 204 No Content
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


