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
 * Task category REST API endpoints
 * 
 * Note: All endpoints require Authorization header: Bearer <token>
 * userId is automatically extracted from token to ensure users can only operate their own categories
 */
@RestController
@RequestMapping("/task-categories")
public class TaskCategoryController {

    @Autowired
    private TaskCategoryService taskCategoryService;

    /**
     * Get all categories for current user
     * 
     * URL: GET /api/task-categories
     * Header: Authorization: Bearer <token>
     * 
     * Returns: List of all task categories for current user
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
     * Get category by ID (validates ownership)
     * 
     * URL: GET /api/task-categories/{id}
     * Header: Authorization: Bearer <token>
     * 
     * Returns: Category with specified ID, or 404 if not found or not owned by current user
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
     * Create new category (automatically associated with current user)
     * 
     * URL: POST /api/task-categories
     * Header: Authorization: Bearer <token>
     * 
     * Request body example:
     *   {
     *     "name": "Work"
     *   }
     * 
     * Returns 400 if category name already exists for this user, otherwise creates and returns new category
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
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(created.get());
    }

    /**
     * Delete category (only own categories)
     * 
     * URL: DELETE /api/task-categories/{id}
     * Header: Authorization: Bearer <token>
     * 
     * Returns 404 if category doesn't exist or doesn't belong to current user,
     * otherwise deletes and returns 204
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

    /**
     * Request body for creating category
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

