package com.asteritime.server.repository;

import com.asteritime.common.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    
    /**
     * Find all tasks for a specific user
     */
    List<Task> findByUser_Id(Long userId);
    
    /**
     * Find specific task for a specific user
     */
    Optional<Task> findByIdAndUser_Id(Long id, Long userId);
    
    /**
     * Find tasks by user + quadrant
     */
    List<Task> findByUser_IdAndQuadrant(Long userId, Integer quadrant);
    
    /**
     * Find tasks by user + category
     */
    List<Task> findByUser_IdAndType_Id(Long userId, Long categoryId);
    
    /**
     * Find tasks by user + status
     */
    List<Task> findByUser_IdAndStatus(Long userId, String status);
    
    /**
     * Find tasks by user + time range (based on planned start time)
     */
    List<Task> findByUser_IdAndPlannedStartTimeBetween(Long userId, LocalDateTime start, LocalDateTime end);
    
    /**
     * Find tasks by user + quadrant + category
     */
    List<Task> findByUser_IdAndQuadrantAndType_Id(Long userId, Integer quadrant, Long categoryId);
    
    /**
     * Find tasks by user + quadrant + status
     */
    List<Task> findByUser_IdAndQuadrantAndStatus(Long userId, Integer quadrant, String status);
    
    /**
     * Find tasks by user + category + status
     */
    List<Task> findByUser_IdAndType_IdAndStatus(Long userId, Long categoryId, String status);
    
    /**
     * Find tasks by user + quadrant + time range
     */
    List<Task> findByUser_IdAndQuadrantAndPlannedStartTimeBetween(Long userId, Integer quadrant, LocalDateTime start, LocalDateTime end);
    
    /**
     * Find tasks by user + category + time range
     */
    List<Task> findByUser_IdAndType_IdAndPlannedStartTimeBetween(Long userId, Long categoryId, LocalDateTime start, LocalDateTime end);
    
    /**
     * Find tasks by user + status + time range
     */
    List<Task> findByUser_IdAndStatusAndPlannedStartTimeBetween(Long userId, String status, LocalDateTime start, LocalDateTime end);
    
    /**
     * Find tasks by user + quadrant + category + status
     */
    List<Task> findByUser_IdAndQuadrantAndType_IdAndStatus(Long userId, Integer quadrant, Long categoryId, String status);
    
    /**
     * Find tasks by user + quadrant + status + time range
     */
    List<Task> findByUser_IdAndQuadrantAndStatusAndPlannedStartTimeBetween(Long userId, Integer quadrant, String status, LocalDateTime start, LocalDateTime end);
    
    /**
     * Find tasks by user + category + status + time range
     */
    List<Task> findByUser_IdAndType_IdAndStatusAndPlannedStartTimeBetween(Long userId, Long categoryId, String status, LocalDateTime start, LocalDateTime end);
    
    /**
     * Find tasks by user + quadrant + category + time range
     */
    List<Task> findByUser_IdAndQuadrantAndType_IdAndPlannedStartTimeBetween(Long userId, Integer quadrant, Long categoryId, LocalDateTime start, LocalDateTime end);
    
    /**
     * Find tasks by user + quadrant + category + status + time range
     */
    List<Task> findByUser_IdAndQuadrantAndType_IdAndStatusAndPlannedStartTimeBetween(Long userId, Integer quadrant, Long categoryId, String status, LocalDateTime start, LocalDateTime end);
}


