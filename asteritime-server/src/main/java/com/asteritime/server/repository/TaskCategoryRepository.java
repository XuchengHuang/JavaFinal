package com.asteritime.server.repository;

import com.asteritime.common.model.TaskCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TaskCategoryRepository extends JpaRepository<TaskCategory, Long> {
    
    /**
     * 查询指定用户的所有类别
     */
    java.util.List<TaskCategory> findByUser_Id(Long userId);
    
    /**
     * 查询指定用户的指定类别（用于检查重复）
     */
    Optional<TaskCategory> findByUser_IdAndName(Long userId, String name);
    
    /**
     * 查询指定用户的指定类别（按ID）
     */
    Optional<TaskCategory> findByIdAndUser_Id(Long id, Long userId);
}

