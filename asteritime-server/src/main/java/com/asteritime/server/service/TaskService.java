package com.asteritime.server.service;

import com.asteritime.common.model.Task;
import com.asteritime.common.model.TaskStatus;
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
     * 更新任务（智能合并更新，保留已有字段，根据状态变更自动设置时间）
     * 
     * @param id 任务ID
     * @param userId 用户ID（用于验证权限）
     * @param updatedTask 包含更新字段的任务对象（可能只包含部分字段）
     * @return 更新后的任务
     */
    public Task updateTask(Long id, Long userId, Task updatedTask) {
        // 获取现有任务
        Optional<Task> existingTaskOpt = taskRepository.findByIdAndUser_Id(id, userId);
        if (!existingTaskOpt.isPresent()) {
            throw new RuntimeException("任务不存在或不属于当前用户");
        }
        
        Task existingTask = existingTaskOpt.get();
        TaskStatus oldStatus = existingTask.getStatus();
        TaskStatus newStatus = updatedTask.getStatus();
        
        // 确保existingTask的必填字段不为null（从数据库加载的应该都有值，但作为安全措施）
        if (existingTask.getQuadrant() == null) {
            throw new RuntimeException("任务象限不能为空，任务数据可能已损坏");
        }
        if (existingTask.getStatus() == null) {
            throw new RuntimeException("任务状态不能为空，任务数据可能已损坏");
        }
        
        // 更新基本字段（如果前端提供了）
        // 注意：只更新前端明确提供的非null字段，避免覆盖已有值
        if (updatedTask.getTitle() != null && !updatedTask.getTitle().isEmpty()) {
            existingTask.setTitle(updatedTask.getTitle());
        }
        if (updatedTask.getDescription() != null) {
            existingTask.setDescription(updatedTask.getDescription());
        }
        // quadrant是必填字段，如果前端明确提供了非null值，才更新
        if (updatedTask.getQuadrant() != null) {
            existingTask.setQuadrant(updatedTask.getQuadrant());
        }
        // 只有当前端明确提供了type且type的id不为null时才更新
        if (updatedTask.getType() != null && updatedTask.getType().getId() != null) {
            existingTask.setType(updatedTask.getType());
        }
        // 只有当前端明确提供了recurrenceRule且recurrenceRule的id不为null时才更新
        if (updatedTask.getRecurrenceRule() != null && updatedTask.getRecurrenceRule().getId() != null) {
            existingTask.setRecurrenceRule(updatedTask.getRecurrenceRule());
        }
        if (updatedTask.getPlannedStartTime() != null) {
            existingTask.setPlannedStartTime(updatedTask.getPlannedStartTime());
        }
        if (updatedTask.getPlannedEndTime() != null) {
            existingTask.setPlannedEndTime(updatedTask.getPlannedEndTime());
        }
        
        // 处理状态变更和时间字段
        if (newStatus != null && newStatus != oldStatus) {
            // 验证：TODO状态不能直接变为DONE
            if (oldStatus == TaskStatus.TODO && newStatus == TaskStatus.DONE) {
                throw new RuntimeException("待办任务需要先变为'进行中'状态，才能标记为'已完成'");
            }
            
            // 验证：DOING状态不能变为TODO
            if (oldStatus == TaskStatus.DOING && newStatus == TaskStatus.TODO) {
                throw new RuntimeException("进行中的任务不能改回'待办'状态");
            }
            
            existingTask.setStatus(newStatus);
            
            // 如果状态变为DOING
            if (newStatus == TaskStatus.DOING) {
                // 如果前端明确提供了actualStartTime（非null），使用前端提供的值
                // 否则，如果当前actualStartTime为空，则设置为当前时间
                if (updatedTask.getActualStartTime() != null) {
                    existingTask.setActualStartTime(updatedTask.getActualStartTime());
                } else if (existingTask.getActualStartTime() == null) {
                    existingTask.setActualStartTime(LocalDateTime.now());
                }
                // 如果已有actualStartTime且前端没有提供新值，保持原有值不变
            }
            
            // 如果状态变为DONE
            if (newStatus == TaskStatus.DONE) {
                // 如果前端明确提供了actualEndTime（非null），使用前端提供的值
                // 否则，如果当前actualEndTime为空，则设置为当前时间
                if (updatedTask.getActualEndTime() != null) {
                    existingTask.setActualEndTime(updatedTask.getActualEndTime());
                } else if (existingTask.getActualEndTime() == null) {
                    existingTask.setActualEndTime(LocalDateTime.now());
                }
                // 如果已有actualEndTime且前端没有提供新值，保持原有值不变
                
                // 确保actualStartTime不为空（如果为空则设置为当前时间）
                // 注意：这里不覆盖已有的actualStartTime，只处理为空的情况
                if (existingTask.getActualStartTime() == null) {
                    existingTask.setActualStartTime(LocalDateTime.now());
                }
            }
        } else if (newStatus != null) {
            // 状态没有变化，但前端可能更新了时间字段
            existingTask.setStatus(newStatus);
        }
        
        // 如果状态没有变更，但前端明确提供了时间字段，则更新（用于手动编辑时间的情况）
        // 注意：只有在状态没有变更的情况下才允许手动更新时间字段
        // 如果状态有变更，时间字段已经在上面根据状态变更逻辑处理了
        if (newStatus == null || newStatus == oldStatus) {
            // 如果前端明确提供了actualStartTime（非null），使用前端提供的值
            if (updatedTask.getActualStartTime() != null) {
                existingTask.setActualStartTime(updatedTask.getActualStartTime());
            }
            
            // 如果前端明确提供了actualEndTime（非null），使用前端提供的值
            if (updatedTask.getActualEndTime() != null) {
                existingTask.setActualEndTime(updatedTask.getActualEndTime());
            }
        }
        
        // 保存前再次验证必填字段
        if (existingTask.getQuadrant() == null) {
            throw new RuntimeException("任务象限不能为空");
        }
        if (existingTask.getStatus() == null) {
            throw new RuntimeException("任务状态不能为空");
        }
        if (existingTask.getTitle() == null || existingTask.getTitle().isEmpty()) {
            throw new RuntimeException("任务标题不能为空");
        }
        
        return taskRepository.save(existingTask);
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


