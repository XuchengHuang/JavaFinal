package com.asteritime.server.controller;

import com.asteritime.common.model.TaskCategory;
import com.asteritime.server.service.TaskCategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Optional;

/**
 * 任务类别相关接口
 * 
 * 注意：所有接口都需要在 Header 中携带 token：Authorization: Bearer <token>
 * userId 会自动从 token 中提取，确保用户只能操作自己的类别
 */
@RestController
@RequestMapping("/task-categories")
public class TaskCategoryController {

    @Autowired
    private TaskCategoryService taskCategoryService;

    /**
     * 查询当前用户的所有类别
     * 
     * URL:
     *   GET /api/task-categories
     *   Header: Authorization: Bearer <token>
     * 
     * 返回：当前用户的所有任务类别列表
     */
    @GetMapping
    public ResponseEntity<List<TaskCategory>> getAllCategories(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(taskCategoryService.findAllByUserId(userId));
    }

    /**
     * 根据 ID 查询类别（验证属于当前用户）
     * 
     * URL:
     *   GET /api/task-categories/{id}
     *   Header: Authorization: Bearer <token>
     * 
     * 返回：指定 ID 的类别，如果不存在或不属于当前用户则返回 404
     */
    @GetMapping("/{id}")
    public ResponseEntity<TaskCategory> getCategory(HttpServletRequest request, @PathVariable Long id) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return taskCategoryService.findByIdAndUserId(id, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 创建新类别（自动关联到当前用户）
     * 
     * URL:
     *   POST /api/task-categories
     *   Header: Authorization: Bearer <token>
     * 
     * 请求体示例：
     *   {
     *     "name": "工作"
     *   }
     * 
     * 逻辑：
     *   - 如果该用户下类别名称已存在，返回 400
     *   - 否则创建新类别并返回
     */
    @PostMapping
    public ResponseEntity<TaskCategory> createCategory(HttpServletRequest request,
                                                        @RequestBody CreateCategoryRequest requestBody) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        if (requestBody.getName() == null || requestBody.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Optional<TaskCategory> created = taskCategoryService.create(userId, requestBody.getName().trim());
        if (!created.isPresent()) {
            // 名称已存在
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(created.get());
    }

    /**
     * 删除类别（只能删除自己的类别）
     * 
     * URL:
     *   DELETE /api/task-categories/{id}
     *   Header: Authorization: Bearer <token>
     * 
     * 逻辑：
     *   - 如果类别不存在或不属于当前用户，返回 404
     *   - 否则删除并返回 204
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(HttpServletRequest request, @PathVariable Long id) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        if (taskCategoryService.deleteByIdAndUserId(id, userId)) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // ====== DTO ======

    /**
     * 用于接收创建类别的请求体
     */
    public static class CreateCategoryRequest {
        private String name;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }
    }
}

