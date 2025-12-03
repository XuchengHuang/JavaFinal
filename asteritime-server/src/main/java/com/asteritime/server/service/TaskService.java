package com.asteritime.server.service;

import com.asteritime.common.model.Task;
import com.asteritime.common.model.User;
import com.asteritime.server.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    /**
     * 查询指定用户的所有任务
     */
    public List<Task> findAllByUserId(Long userId) {
        return taskRepository.findByUser_Id(userId);
    }

    /**
     * 按条件查询指定用户的任务（支持组合查询）
     * 
     * @param userId 用户ID（必填）
     * @param quadrant 四象限（1-4，可选）
     * @param categoryId 类别ID（可选）
     * @param status 状态（可选）
     * @param startTime 开始时间（可选）
     * @param endTime 结束时间（可选）
     * @return 符合条件的任务列表
     */
    public List<Task> findByConditions(Long userId, Integer quadrant, Long categoryId, 
                                       String status, LocalDateTime startTime, LocalDateTime endTime) {
        // 如果指定了时间范围，需要确保 startTime 和 endTime 都存在
        boolean hasTimeRange = startTime != null && endTime != null;
        
        // 根据条件组合调用不同的查询方法（按优先级：四象限 + 类别 + 状态 + 时间范围）
        if (quadrant != null && categoryId != null && status != null && hasTimeRange) {
            // 四象限 + 类别 + 状态 + 时间范围
            return taskRepository.findByUser_IdAndQuadrantAndType_IdAndStatusAndPlannedStartTimeBetween(
                    userId, quadrant, categoryId, status, startTime, endTime);
        } else if (quadrant != null && categoryId != null && hasTimeRange) {
            // 四象限 + 类别 + 时间范围
            return taskRepository.findByUser_IdAndQuadrantAndType_IdAndPlannedStartTimeBetween(
                    userId, quadrant, categoryId, startTime, endTime);
        } else if (quadrant != null && status != null && hasTimeRange) {
            // 四象限 + 状态 + 时间范围
            return taskRepository.findByUser_IdAndQuadrantAndStatusAndPlannedStartTimeBetween(
                    userId, quadrant, status, startTime, endTime);
        } else if (categoryId != null && status != null && hasTimeRange) {
            // 类别 + 状态 + 时间范围
            return taskRepository.findByUser_IdAndType_IdAndStatusAndPlannedStartTimeBetween(
                    userId, categoryId, status, startTime, endTime);
        } else if (quadrant != null && categoryId != null && status != null) {
            // 四象限 + 类别 + 状态
            return taskRepository.findByUser_IdAndQuadrantAndType_IdAndStatus(userId, quadrant, categoryId, status);
        } else if (quadrant != null && hasTimeRange) {
            // 四象限 + 时间范围
            return taskRepository.findByUser_IdAndQuadrantAndPlannedStartTimeBetween(
                    userId, quadrant, startTime, endTime);
        } else if (categoryId != null && hasTimeRange) {
            // 类别 + 时间范围
            return taskRepository.findByUser_IdAndType_IdAndPlannedStartTimeBetween(
                    userId, categoryId, startTime, endTime);
        } else if (status != null && hasTimeRange) {
            // 状态 + 时间范围
            return taskRepository.findByUser_IdAndStatusAndPlannedStartTimeBetween(
                    userId, status, startTime, endTime);
        } else if (quadrant != null && categoryId != null) {
            // 四象限 + 类别
            return taskRepository.findByUser_IdAndQuadrantAndType_Id(userId, quadrant, categoryId);
        } else if (quadrant != null && status != null) {
            // 四象限 + 状态
            return taskRepository.findByUser_IdAndQuadrantAndStatus(userId, quadrant, status);
        } else if (categoryId != null && status != null) {
            // 类别 + 状态
            return taskRepository.findByUser_IdAndType_IdAndStatus(userId, categoryId, status);
        } else if (quadrant != null) {
            // 仅四象限
            return taskRepository.findByUser_IdAndQuadrant(userId, quadrant);
        } else if (categoryId != null) {
            // 仅类别
            return taskRepository.findByUser_IdAndType_Id(userId, categoryId);
        } else if (status != null) {
            // 仅状态
            return taskRepository.findByUser_IdAndStatus(userId, status);
        } else if (hasTimeRange) {
            // 仅时间范围
            return taskRepository.findByUser_IdAndPlannedStartTimeBetween(userId, startTime, endTime);
        } else {
            // 无过滤条件，返回所有任务
            return taskRepository.findByUser_Id(userId);
        }
    }

    /**
     * 查询指定用户的指定任务（确保任务属于该用户）
     */
    public Optional<Task> findByIdAndUserId(Long id, Long userId) {
        return taskRepository.findByIdAndUser_Id(id, userId);
    }

    /**
     * 保存任务（会自动关联到任务中的 user）
     */
    public Task save(Task task) {
        return taskRepository.save(task);
    }

    /**
     * 删除指定用户的指定任务（确保任务属于该用户）
     */
    public boolean deleteByIdAndUserId(Long id, Long userId) {
        Optional<Task> taskOpt = taskRepository.findByIdAndUser_Id(id, userId);
        if (taskOpt.isPresent()) {
            taskRepository.deleteById(id);
            return true;
        }
        return false;
    }
}


