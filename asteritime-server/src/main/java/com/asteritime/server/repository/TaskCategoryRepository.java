package com.asteritime.server.repository;

import com.asteritime.common.model.TaskCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TaskCategoryRepository extends JpaRepository<TaskCategory, Long> {
    
    /**
     * Find all categories for a specific user
     */
    java.util.List<TaskCategory> findByUser_Id(Long userId);
    
    /**
     * Find specific category for a specific user (for duplicate checking)
     */
    Optional<TaskCategory> findByUser_IdAndName(Long userId, String name);
    
    /**
     * Find specific category for a specific user (by ID)
     */
    Optional<TaskCategory> findByIdAndUser_Id(Long id, Long userId);
}

