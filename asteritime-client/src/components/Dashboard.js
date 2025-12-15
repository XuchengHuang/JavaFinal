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

  const checkAndUpdateTaskStatus = useCallback((task) => {
    const now = new Date();
    const startTime = task.plannedStartTime ? new Date(task.plannedStartTime) : null;
    const endTime = task.plannedEndTime ? new Date(task.plannedEndTime) : null;

    if (task.status === 'DONE' || task.status === 'CANCEL') {
      return task;
    }

    if (task.status === 'DOING' && endTime && now >= endTime) {
      const actualEndTime = task.plannedEndTime 
        ? (typeof task.plannedEndTime === 'string' 
            ? task.plannedEndTime.slice(0, 19) 
            : formatLocalDateTimeISO(new Date(task.plannedEndTime)))
        : null;
      
      return {
        ...task,
        status: 'DONE',
        actualEndTime: actualEndTime,
      };
    }

    if (endTime && now > endTime && task.status !== 'DELAY' && task.status !== 'DONE') {
      return { ...task, status: 'DELAY' };
    }

    if (startTime && endTime && now >= startTime && now <= endTime && task.status === 'TODO') {
      return {
        ...task,
        status: 'DOING',
        actualStartTime: task.plannedStartTime,
      };
    }

    return task;
  }, []);

  const getTodayTimeRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    const startTime = `${year}-${month}-${day}T00:00:00`;
    const endTime = `${year}-${month}-${day}T23:59:59`;
    
    return { startTime, endTime };
  };

  const loadTasks = async (autoUpdate = true) => {
    try {
      setLoading(true);
      const { startTime, endTime } = getTodayTimeRange();
      const allTasks = await getTasks({ startTime, endTime });
      
      if (autoUpdate) {
        const updatePromises = allTasks.map(async (task) => {
          const updatedTask = checkAndUpdateTaskStatus(task);
          if (updatedTask.status !== task.status || 
              updatedTask.actualEndTime !== task.actualEndTime ||
              updatedTask.actualStartTime !== task.actualStartTime) {
            try {
              const updateData = {
                ...task,
                status: updatedTask.status,
              };
              if (updatedTask.actualStartTime) {
                updateData.actualStartTime = updatedTask.actualStartTime;
              }
              if (updatedTask.actualEndTime) {
                updateData.actualEndTime = updatedTask.actualEndTime;
              }
              const savedTask = await updateTask(task.id, updateData);
              return savedTask;
            } catch (error) {
              console.error(`Failed to auto-update task ${task.id} status:`, error);
              return task;
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
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    
    const interval = setInterval(() => {
      loadTasks(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [checkAndUpdateTaskStatus]);

  const tasksByQuadrant = {
    1: tasks.filter(task => task.quadrant === 1 && task.status !== 'DELAY' && task.status !== 'CANCEL'),
    2: tasks.filter(task => task.quadrant === 2 && task.status !== 'DELAY' && task.status !== 'CANCEL'),
    3: tasks.filter(task => task.quadrant === 3 && task.status !== 'DELAY' && task.status !== 'CANCEL'),
    4: tasks.filter(task => task.quadrant === 4 && task.status !== 'DELAY' && task.status !== 'CANCEL'),
  };

  const tasksByStatus = {
    TODO: tasks.filter(task => task.status === 'TODO'),
    DOING: tasks.filter(task => task.status === 'DOING'),
    DONE: tasks.filter(task => task.status === 'DONE'),
    DELAY_OR_CANCEL: tasks.filter(task => task.status === 'DELAY' || task.status === 'CANCEL'),
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsStatusModalOpen(true);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      if (task.status === 'TODO' && newStatus === 'DONE') {
        throw new Error('Task in TODO status must be changed to DOING status first before marking as DONE');
      }

      // Validation: DOING status cannot be changed back to TODO
      if (task.status === 'DOING' && newStatus === 'TODO') {
        throw new Error('Task in DOING status cannot be changed back to TODO status');
      }

      // Only send fields that need to be updated to avoid issues with sending complete object
      const updateData = {
        status: newStatus,
      };

      // Format local time as YYYY-MM-DDTHH:mm:ss format (without timezone)
      // If manually changing status to DOING, set actualStartTime to current local time
      if (newStatus === 'DOING' && task.status === 'TODO') {
        updateData.actualStartTime = formatLocalDateTimeISO(new Date());
      }

      // If manually changing status to DONE, set actualEndTime to current local time (provided status is not TODO)
      if (newStatus === 'DONE' && task.status !== 'DONE' && task.status !== 'TODO') {
        updateData.actualEndTime = formatLocalDateTimeISO(new Date());
      }

      await updateTask(taskId, updateData);

      // Automatically refresh task list after status change
      await loadTasks(false);
    } catch (error) {
      console.error('Failed to update task status:', error);
      throw error;
    }
  };

  // Handle delete request
  const handleDeleteRequest = (task) => {
    setSelectedTask(task);
    setIsDeleteModalOpen(true);
    setIsStatusModalOpen(false); // Close status change modal
  };

  // Confirm delete task
  const handleDeleteConfirm = async (taskId) => {
    try {
      setDeleting(true);
      await deleteTask(taskId);
      
      // Remove from local task list
      setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
      
      setIsDeleteModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Failed to delete task, please try again later');
    } finally {
      setDeleting(false);
    }
  };


  const handleCreateSuccess = () => {
    // Refresh task list after successful task creation (no auto status update needed for new tasks)
    console.log('Task created successfully, refreshing list...');
    loadTasks(false);
  };

  return (
    <>
      <div className="dashboard-content">
        {/* Top: Eisenhower Quadrants */}
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

        {/* Bottom: Kanban Board */}
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
              title="Delayed/Cancelled" 
              tasks={tasksByStatus.DELAY_OR_CANCEL}
            />
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Status Change Modal */}
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

      {/* Delete Confirmation Modal */}
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

