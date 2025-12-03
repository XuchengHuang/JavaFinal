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
     * 查询指定用户的所有类别
     */
    public List<TaskCategory> findAllByUserId(Long userId) {
        return taskCategoryRepository.findByUser_Id(userId);
    }

    /**
     * 根据 ID 查询类别（验证属于指定用户）
     */
    public Optional<TaskCategory> findByIdAndUserId(Long id, Long userId) {
        return taskCategoryRepository.findByIdAndUser_Id(id, userId);
    }

    /**
     * 创建新类别
     * 
     * @param userId 用户ID
     * @param name 类别名称
     * @return 创建成功的类别，如果名称已存在则返回 Optional.empty()
     */
    public Optional<TaskCategory> create(Long userId, String name) {
        // 检查该用户下名称是否已存在
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
     * 删除类别（验证属于指定用户）
     * 
     * @param id 类别 ID
     * @param userId 用户ID
     * @return true 如果删除成功，false 如果类别不存在或不属于该用户
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

