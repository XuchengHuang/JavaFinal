package com.asteritime.server.service;

import com.asteritime.common.model.Task;
import com.asteritime.common.model.TaskStatus;
import com.asteritime.common.model.User;
import com.asteritime.server.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(isolation = Isolation.READ_COMMITTED)
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    /**
     * Find all tasks for a specific user
     */
    public List<Task> findAllByUserId(Long userId) {
        return taskRepository.findByUser_Id(userId);
    }

    /**
     * Find tasks for a specific user by conditions (supports combined queries)
     * 
     * @param userId User ID (required)
     * @param quadrant Quadrant (1-4, optional)
     * @param categoryId Category ID (optional)
     * @param status Status (optional)
     * @param startTime Start time (optional)
     * @param endTime End time (optional)
     * @return List of matching tasks
     */
    public List<Task> findByConditions(Long userId, Integer quadrant, Long categoryId, 
                                       String status, LocalDateTime startTime, LocalDateTime endTime) {
        boolean hasTimeRange = startTime != null && endTime != null;
        
        if (quadrant != null && categoryId != null && status != null && hasTimeRange) {
            return taskRepository.findByUser_IdAndQuadrantAndType_IdAndStatusAndPlannedStartTimeBetween(
                    userId, quadrant, categoryId, status, startTime, endTime);
        } else if (quadrant != null && categoryId != null && hasTimeRange) {
            return taskRepository.findByUser_IdAndQuadrantAndType_IdAndPlannedStartTimeBetween(
                    userId, quadrant, categoryId, startTime, endTime);
        } else if (quadrant != null && status != null && hasTimeRange) {
            return taskRepository.findByUser_IdAndQuadrantAndStatusAndPlannedStartTimeBetween(
                    userId, quadrant, status, startTime, endTime);
        } else if (categoryId != null && status != null && hasTimeRange) {
            return taskRepository.findByUser_IdAndType_IdAndStatusAndPlannedStartTimeBetween(
                    userId, categoryId, status, startTime, endTime);
        } else if (quadrant != null && categoryId != null && status != null) {
            return taskRepository.findByUser_IdAndQuadrantAndType_IdAndStatus(userId, quadrant, categoryId, status);
        } else if (quadrant != null && hasTimeRange) {
            return taskRepository.findByUser_IdAndQuadrantAndPlannedStartTimeBetween(
                    userId, quadrant, startTime, endTime);
        } else if (categoryId != null && hasTimeRange) {
            return taskRepository.findByUser_IdAndType_IdAndPlannedStartTimeBetween(
                    userId, categoryId, startTime, endTime);
        } else if (status != null && hasTimeRange) {
            return taskRepository.findByUser_IdAndStatusAndPlannedStartTimeBetween(
                    userId, status, startTime, endTime);
        } else if (quadrant != null && categoryId != null) {
            return taskRepository.findByUser_IdAndQuadrantAndType_Id(userId, quadrant, categoryId);
        } else if (quadrant != null && status != null) {
            return taskRepository.findByUser_IdAndQuadrantAndStatus(userId, quadrant, status);
        } else if (categoryId != null && status != null) {
            return taskRepository.findByUser_IdAndType_IdAndStatus(userId, categoryId, status);
        } else if (quadrant != null) {
            return taskRepository.findByUser_IdAndQuadrant(userId, quadrant);
        } else if (categoryId != null) {
            return taskRepository.findByUser_IdAndType_Id(userId, categoryId);
        } else if (status != null) {
            return taskRepository.findByUser_IdAndStatus(userId, status);
        } else if (hasTimeRange) {
            return taskRepository.findByUser_IdAndPlannedStartTimeBetween(userId, startTime, endTime);
        } else {
            return taskRepository.findByUser_Id(userId);
        }
    }

    /**
     * Find specific task for a specific user (ensures task belongs to user)
     */
    public Optional<Task> findByIdAndUserId(Long id, Long userId) {
        return taskRepository.findByIdAndUser_Id(id, userId);
    }

    /**
     * Save task (automatically associates with user in task)
     */
    public Task save(Task task) {
        return taskRepository.save(task);
    }

    /**
     * Update task (smart merge update, preserves existing fields, auto-sets time based on status change)
     * Uses optimistic locking to prevent concurrent update conflicts
     * 
     * @param id Task ID
     * @param userId User ID (for permission verification)
     * @param updatedTask Task object with updated fields (may only contain partial fields)
     * @return Updated task
     * @throws OptimisticLockingFailureException if concurrent update conflict occurs
     */
    @Retryable(value = {OptimisticLockingFailureException.class}, maxAttempts = 3, backoff = @Backoff(delay = 100))
    public Task updateTask(Long id, Long userId, Task updatedTask) {
        Optional<Task> existingTaskOpt = taskRepository.findByIdAndUser_Id(id, userId);
        if (!existingTaskOpt.isPresent()) {
            throw new RuntimeException("Task does not exist or does not belong to current user");
        }
        
        Task existingTask = existingTaskOpt.get();
        TaskStatus oldStatus = existingTask.getStatus();
        TaskStatus newStatus = updatedTask.getStatus();
        
        if (existingTask.getQuadrant() == null) {
            throw new RuntimeException("Task quadrant cannot be null, task data may be corrupted");
        }
        if (existingTask.getStatus() == null) {
            throw new RuntimeException("Task status cannot be null, task data may be corrupted");
        }
        
        if (updatedTask.getTitle() != null && !updatedTask.getTitle().isEmpty()) {
            existingTask.setTitle(updatedTask.getTitle());
        }
        if (updatedTask.getDescription() != null) {
            existingTask.setDescription(updatedTask.getDescription());
        }
        if (updatedTask.getQuadrant() != null) {
            existingTask.setQuadrant(updatedTask.getQuadrant());
        }
        if (updatedTask.getType() != null && updatedTask.getType().getId() != null) {
            existingTask.setType(updatedTask.getType());
        }
        if (updatedTask.getRecurrenceRule() != null && updatedTask.getRecurrenceRule().getId() != null) {
            existingTask.setRecurrenceRule(updatedTask.getRecurrenceRule());
        }
        if (updatedTask.getPlannedStartTime() != null) {
            existingTask.setPlannedStartTime(updatedTask.getPlannedStartTime());
        }
        if (updatedTask.getPlannedEndTime() != null) {
            existingTask.setPlannedEndTime(updatedTask.getPlannedEndTime());
        }
        
        if (newStatus != null && newStatus != oldStatus) {
            if (oldStatus == TaskStatus.TODO && newStatus == TaskStatus.DONE) {
                throw new RuntimeException("TODO task must be changed to DOING status before marking as DONE");
            }
            
            if (oldStatus == TaskStatus.DOING && newStatus == TaskStatus.TODO) {
                throw new RuntimeException("DOING task cannot be changed back to TODO status");
            }
            
            existingTask.setStatus(newStatus);
            
            if (newStatus == TaskStatus.DOING) {
                if (updatedTask.getActualStartTime() != null) {
                    existingTask.setActualStartTime(updatedTask.getActualStartTime());
                } else if (existingTask.getActualStartTime() == null) {
                    existingTask.setActualStartTime(LocalDateTime.now());
                }
            }
            
            if (newStatus == TaskStatus.DONE) {
                if (updatedTask.getActualEndTime() != null) {
                    existingTask.setActualEndTime(updatedTask.getActualEndTime());
                } else if (existingTask.getActualEndTime() == null) {
                    existingTask.setActualEndTime(LocalDateTime.now());
                }
                
                if (existingTask.getActualStartTime() == null) {
                    existingTask.setActualStartTime(LocalDateTime.now());
                }
            }
        } else if (newStatus != null) {
            existingTask.setStatus(newStatus);
        }
        
        if (newStatus == null || newStatus == oldStatus) {
            if (updatedTask.getActualStartTime() != null) {
                existingTask.setActualStartTime(updatedTask.getActualStartTime());
            }
            
            if (updatedTask.getActualEndTime() != null) {
                existingTask.setActualEndTime(updatedTask.getActualEndTime());
            }
        }
        
        if (existingTask.getQuadrant() == null) {
            throw new RuntimeException("Task quadrant cannot be null");
        }
        if (existingTask.getStatus() == null) {
            throw new RuntimeException("Task status cannot be null");
        }
        if (existingTask.getTitle() == null || existingTask.getTitle().isEmpty()) {
            throw new RuntimeException("Task title cannot be empty");
        }
        
        try {
            if (updatedTask.getVersion() != null) {
                existingTask.setVersion(updatedTask.getVersion());
            }
            return taskRepository.save(existingTask);
        } catch (OptimisticLockingFailureException e) {
            throw new OptimisticLockingFailureException("Task has been modified by another operation, please refresh and retry", e);
        }
    }

    /**
     * Delete specific task for specific user (ensures task belongs to user)
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


