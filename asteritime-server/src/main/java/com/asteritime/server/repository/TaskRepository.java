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
     * 查询指定用户的所有任务
     */
    List<Task> findByUser_Id(Long userId);
    
    /**
     * 查询指定用户的指定任务
     */
    Optional<Task> findByIdAndUser_Id(Long id, Long userId);
    
    /**
     * 按用户 + 四象限查询任务
     */
    List<Task> findByUser_IdAndQuadrant(Long userId, Integer quadrant);
    
    /**
     * 按用户 + 类别查询任务
     */
    List<Task> findByUser_IdAndType_Id(Long userId, Long categoryId);
    
    /**
     * 按用户 + 状态查询任务
     */
    List<Task> findByUser_IdAndStatus(Long userId, String status);
    
    /**
     * 按用户 + 时间范围查询任务（基于计划开始时间）
     */
    List<Task> findByUser_IdAndPlannedStartTimeBetween(Long userId, LocalDateTime start, LocalDateTime end);
    
    /**
     * 按用户 + 四象限 + 类别查询任务
     */
    List<Task> findByUser_IdAndQuadrantAndType_Id(Long userId, Integer quadrant, Long categoryId);
    
    /**
     * 按用户 + 四象限 + 状态查询任务
     */
    List<Task> findByUser_IdAndQuadrantAndStatus(Long userId, Integer quadrant, String status);
    
    /**
     * 按用户 + 类别 + 状态查询任务
     */
    List<Task> findByUser_IdAndType_IdAndStatus(Long userId, Long categoryId, String status);
    
    /**
     * 按用户 + 四象限 + 时间范围查询任务
     */
    List<Task> findByUser_IdAndQuadrantAndPlannedStartTimeBetween(Long userId, Integer quadrant, LocalDateTime start, LocalDateTime end);
    
    /**
     * 按用户 + 类别 + 时间范围查询任务
     */
    List<Task> findByUser_IdAndType_IdAndPlannedStartTimeBetween(Long userId, Long categoryId, LocalDateTime start, LocalDateTime end);
    
    /**
     * 按用户 + 状态 + 时间范围查询任务
     */
    List<Task> findByUser_IdAndStatusAndPlannedStartTimeBetween(Long userId, String status, LocalDateTime start, LocalDateTime end);
    
    /**
     * 按用户 + 四象限 + 类别 + 状态查询任务
     */
    List<Task> findByUser_IdAndQuadrantAndType_IdAndStatus(Long userId, Integer quadrant, Long categoryId, String status);
    
    /**
     * 按用户 + 四象限 + 状态 + 时间范围查询任务
     */
    List<Task> findByUser_IdAndQuadrantAndStatusAndPlannedStartTimeBetween(Long userId, Integer quadrant, String status, LocalDateTime start, LocalDateTime end);
    
    /**
     * 按用户 + 类别 + 状态 + 时间范围查询任务
     */
    List<Task> findByUser_IdAndType_IdAndStatusAndPlannedStartTimeBetween(Long userId, Long categoryId, String status, LocalDateTime start, LocalDateTime end);
    
    /**
     * 按用户 + 四象限 + 类别 + 时间范围查询任务
     */
    List<Task> findByUser_IdAndQuadrantAndType_IdAndPlannedStartTimeBetween(Long userId, Integer quadrant, Long categoryId, LocalDateTime start, LocalDateTime end);
    
    /**
     * 按用户 + 四象限 + 类别 + 状态 + 时间范围查询任务
     */
    List<Task> findByUser_IdAndQuadrantAndType_IdAndStatusAndPlannedStartTimeBetween(Long userId, Integer quadrant, Long categoryId, String status, LocalDateTime start, LocalDateTime end);
}


