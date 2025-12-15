import React from 'react';
import './KanbanTaskItem.css';

/**
 * Kanban task item (only displays task name and time range, not editable)
 * @param {object} task - Task object
 */
function KanbanTaskItem({ task }) {
  const formatTime = (timeString) => {
    if (!timeString) return null;
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', {
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
            <span>Start: {startTime}</span>
          ) : (
            <span>End: {endTime}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default KanbanTaskItem;

