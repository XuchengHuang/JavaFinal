import React, { useState, useEffect, useCallback } from 'react';
import { getTasks, updateTask, deleteTask } from '../api/task';
import QuadrantPanel from './QuadrantPanel';
import KanbanColumn from './KanbanColumn';
import CreateTaskModal from './CreateTaskModal';
import StatusChangeModal from './StatusChangeModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import { formatLocalDateTimeISO } from '../utils/dateUtils';
import './Dashboard.css';

function Dashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // 检查并自动更新任务状态
  const checkAndUpdateTaskStatus = useCallback((task) => {
    const now = new Date();
    const startTime = task.plannedStartTime ? new Date(task.plannedStartTime) : null;
    const endTime = task.plannedEndTime ? new Date(task.plannedEndTime) : null;

    // 如果任务已完成或已取消，不自动更新
    if (task.status === 'DONE' || task.status === 'CANCEL') {
      return task;
    }

    // 如果DOING状态的任务到了计划结束时间，自动变为已完成，并设置actualEndTime为plannedEndTime
    if (task.status === 'DOING' && endTime && now >= endTime) {
      // 确保actualEndTime格式正确（使用本地时间，格式：YYYY-MM-DDTHH:mm:ss）
      const actualEndTime = task.plannedEndTime 
        ? (typeof task.plannedEndTime === 'string' 
            ? task.plannedEndTime.slice(0, 19) 
            : formatLocalDateTimeISO(new Date(task.plannedEndTime)))
        : null;
      
      return {
        ...task,
        status: 'DONE',
        actualEndTime: actualEndTime, // 使用计划结束时间作为实际结束时间
      };
    }

    // 如果到了截止时间还没完成，自动变成延期
    if (endTime && now > endTime && task.status !== 'DELAY' && task.status !== 'DONE') {
      return { ...task, status: 'DELAY' };
    }

    // 如果时间在计划时间范围内，且状态是待办，自动变成进行中，并设置actualStartTime为plannedStartTime
    if (startTime && endTime && now >= startTime && now <= endTime && task.status === 'TODO') {
      return {
        ...task,
        status: 'DOING',
        actualStartTime: task.plannedStartTime, // 系统自动转换，使用计划开始时间
      };
    }

    return task;
  }, []);

  // 获取当天的开始和结束时间（ISO 8601 格式）
  const getTodayTimeRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    const startTime = `${year}-${month}-${day}T00:00:00`;
    const endTime = `${year}-${month}-${day}T23:59:59`;
    
    return { startTime, endTime };
  };

  // 加载任务列表（只加载当天的任务）
  const loadTasks = async (autoUpdate = true) => {
    try {
      setLoading(true);
      const { startTime, endTime } = getTodayTimeRange();
      const allTasks = await getTasks({ startTime, endTime });
      
      if (autoUpdate) {
        // 检查并自动更新任务状态
        const updatePromises = allTasks.map(async (task) => {
          const updatedTask = checkAndUpdateTaskStatus(task);
          // 如果状态改变了，更新到后端
          if (updatedTask.status !== task.status || 
              updatedTask.actualEndTime !== task.actualEndTime ||
              updatedTask.actualStartTime !== task.actualStartTime) {
            try {
              const updateData = {
                ...task,
                status: updatedTask.status,
              };
              // 如果actualStartTime被设置了，也要更新
              if (updatedTask.actualStartTime) {
                updateData.actualStartTime = updatedTask.actualStartTime;
              }
              // 如果actualEndTime被设置了，也要更新
              if (updatedTask.actualEndTime) {
                updateData.actualEndTime = updatedTask.actualEndTime;
              }
              const savedTask = await updateTask(task.id, updateData);
              return savedTask;
            } catch (error) {
              console.error(`自动更新任务 ${task.id} 状态失败:`, error);
              return task; // 如果更新失败，返回原任务
            }
          }
          return task;
        });
        
        const updatedTasks = await Promise.all(updatePromises);
        setTasks(updatedTasks);
      } else {
        setTasks(allTasks);
      }
    } catch (error) {
      console.error('加载任务失败:', error);
    } finally {
      setLoading(false);
    }
  };


  // 组件挂载时加载任务
  useEffect(() => {
    loadTasks();
    
    // 设置定时器，每分钟检查一次任务状态
    const interval = setInterval(() => {
      loadTasks(true); // 自动更新状态
    }, 60000); // 60秒

    return () => clearInterval(interval);
  }, [checkAndUpdateTaskStatus]);

  // 按象限分组任务（显示所有任务，包括已完成的任务）
  const tasksByQuadrant = {
    1: tasks.filter(task => task.quadrant === 1 && task.status !== 'DELAY' && task.status !== 'CANCEL'),
    2: tasks.filter(task => task.quadrant === 2 && task.status !== 'DELAY' && task.status !== 'CANCEL'),
    3: tasks.filter(task => task.quadrant === 3 && task.status !== 'DELAY' && task.status !== 'CANCEL'),
    4: tasks.filter(task => task.quadrant === 4 && task.status !== 'DELAY' && task.status !== 'CANCEL'),
  };

  // 按状态分组任务（用于 Kanban）
  const tasksByStatus = {
    TODO: tasks.filter(task => task.status === 'TODO'),
    DOING: tasks.filter(task => task.status === 'DOING'),
    DONE: tasks.filter(task => task.status === 'DONE'),
    DELAY_OR_CANCEL: tasks.filter(task => task.status === 'DELAY' || task.status === 'CANCEL'),
  };

  // 处理任务点击
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsStatusModalOpen(true);
  };

  // 处理状态更新
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // 验证：TODO状态不能直接变为DONE
      if (task.status === 'TODO' && newStatus === 'DONE') {
        throw new Error('待办任务需要先变为"进行中"状态，才能标记为"已完成"');
      }

      // 验证：DOING状态不能变为TODO
      if (task.status === 'DOING' && newStatus === 'TODO') {
        throw new Error('进行中的任务不能改回"待办"状态');
      }

      // 只发送需要更新的字段，避免发送完整对象导致的问题
      const updateData = {
        status: newStatus,
      };

      // 格式化本地时间为 YYYY-MM-DDTHH:mm:ss 格式（不带时区）
      // 如果手动将状态改为DOING，设置actualStartTime为当前本地时间
      if (newStatus === 'DOING' && task.status === 'TODO') {
        updateData.actualStartTime = formatLocalDateTimeISO(new Date());
      }

      // 如果手动将状态改为DONE，设置actualEndTime为当前本地时间（前提是状态不是TODO）
      if (newStatus === 'DONE' && task.status !== 'DONE' && task.status !== 'TODO') {
        updateData.actualEndTime = formatLocalDateTimeISO(new Date());
      }

      await updateTask(taskId, updateData);

      // 状态更改后自动刷新任务列表
      await loadTasks(false);
    } catch (error) {
      console.error('更新任务状态失败:', error);
      throw error;
    }
  };

  // 处理删除请求
  const handleDeleteRequest = (task) => {
    setSelectedTask(task);
    setIsDeleteModalOpen(true);
    setIsStatusModalOpen(false); // 关闭状态切换模态框
  };

  // 确认删除任务
  const handleDeleteConfirm = async (taskId) => {
    try {
      setDeleting(true);
      await deleteTask(taskId);
      
      // 从本地任务列表移除
      setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
      
      setIsDeleteModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('删除任务失败:', error);
      alert('删除任务失败，请稍后重试');
    } finally {
      setDeleting(false);
    }
  };


  const handleCreateSuccess = () => {
    // 任务创建成功后刷新任务列表（不自动更新状态，因为新任务不需要）
    console.log('任务创建成功，刷新列表...');
    loadTasks(false);
  };

  return (
    <>
      <div className="dashboard-content">
        {/* 顶部：Eisenhower 四象限 */}
        <div className="quadrant-section">
          <div className="section-header">
            <h2 className="section-title">Eisenhower Quadrants</h2>
            <button 
              className="create-btn"
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create
            </button>
          </div>
          <div className="quadrant-grid">
            <QuadrantPanel 
              quadrant={1} 
              title="Urgent & Important" 
              tasks={tasksByQuadrant[1]}
              onTaskClick={handleTaskClick}
            />
            <QuadrantPanel 
              quadrant={2} 
              title="Not Urgent & Important" 
              tasks={tasksByQuadrant[2]}
              onTaskClick={handleTaskClick}
            />
            <QuadrantPanel 
              quadrant={3} 
              title="Urgent & Not Important" 
              tasks={tasksByQuadrant[3]}
              onTaskClick={handleTaskClick}
            />
            <QuadrantPanel 
              quadrant={4} 
              title="Not Urgent & Not Important" 
              tasks={tasksByQuadrant[4]}
              onTaskClick={handleTaskClick}
            />
          </div>
        </div>

        {/* 底部：Kanban 看板 */}
        <div className="kanban-section">
          <h2 className="section-title">Kanban Board</h2>
          <div className="kanban-board">
            <KanbanColumn 
              title="ToDo" 
              tasks={tasksByStatus.TODO}
            />
            <KanbanColumn 
              title="Doing" 
              tasks={tasksByStatus.DOING}
            />
            <KanbanColumn 
              title="Done" 
              tasks={tasksByStatus.DONE}
            />
            <KanbanColumn 
              title="延期/已取消" 
              tasks={tasksByStatus.DELAY_OR_CANCEL}
            />
          </div>
        </div>
      </div>

      {/* 创建任务模态框 */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* 状态切换模态框 */}
      <StatusChangeModal
        isOpen={isStatusModalOpen}
        task={selectedTask}
        onClose={() => {
          setIsStatusModalOpen(false);
          setSelectedTask(null);
        }}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteRequest}
      />

      {/* 删除确认模态框 */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        task={selectedTask}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedTask(null);
        }}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />
    </>
  );
}

export default Dashboard;

