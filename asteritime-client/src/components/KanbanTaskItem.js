import React from 'react';
import './KanbanTaskItem.css';

/**
 * Kanban 任务项（只显示任务名和时间范围，不可编辑）
 * @param {object} task - 任务对象
 */
function KanbanTaskItem({ task }) {
  const formatTime = (timeString) => {
    if (!timeString) return null;
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch (e) {
      return null;
    }
  };

  const startTime = formatTime(task.plannedStartTime);
  const endTime = formatTime(task.plannedEndTime);

  return (
    <div className="kanban-task-item">
      <div className="kanban-task-title">{task.title}</div>
      {(startTime || endTime) && (
        <div className="kanban-task-time">
          {startTime && endTime ? (
            <span>{startTime} - {endTime}</span>
          ) : startTime ? (
            <span>开始: {startTime}</span>
          ) : (
            <span>结束: {endTime}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default KanbanTaskItem;

