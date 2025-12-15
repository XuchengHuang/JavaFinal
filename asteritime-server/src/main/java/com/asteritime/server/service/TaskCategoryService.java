package com.asteritime.server.service;

import com.asteritime.common.model.TaskCategory;
import com.asteritime.common.model.User;
import com.asteritime.server.repository.TaskCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class TaskCategoryService {

    @Autowired
    private TaskCategoryRepository taskCategoryRepository;

    /**
     * Find all categories for a specific user
     */
    public List<TaskCategory> findAllByUserId(Long userId) {
        return taskCategoryRepository.findByUser_Id(userId);
    }

    /**
     * Find category by ID (validates ownership)
     */
    public Optional<TaskCategory> findByIdAndUserId(Long id, Long userId) {
        return taskCategoryRepository.findByIdAndUser_Id(id, userId);
    }

    /**
     * Create new category
     * 
     * @param userId User ID
     * @param name Category name
     * @return Created category, or Optional.empty() if name already exists
     */
    public Optional<TaskCategory> create(Long userId, String name) {
        if (taskCategoryRepository.findByUser_IdAndName(userId, name).isPresent()) {
            return Optional.empty();
        }

        TaskCategory category = new TaskCategory();
        category.setName(name);
        
        User user = new User();
        user.setId(userId);
        category.setUser(user);
        
        return Optional.of(taskCategoryRepository.save(category));
    }

    /**
     * Delete category (validates ownership)
     * 
     * @param id Category ID
     * @param userId User ID
     * @return true if deletion successful, false if category doesn't exist or doesn't belong to user
     */
    public boolean deleteByIdAndUserId(Long id, Long userId) {
        Optional<TaskCategory> categoryOpt = taskCategoryRepository.findByIdAndUser_Id(id, userId);
        if (!categoryOpt.isPresent()) {
            return false;
        }
        taskCategoryRepository.deleteById(id);
        return true;
    }
}

