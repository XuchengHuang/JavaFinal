import React from 'react';
import './TaskCard.css';

/**
 * Task card component
 * @param {object} task - Task object
 * @param {function} onClick - Click callback
 */
function TaskCard({ task, onClick }) {
  const getStatusColor = (status) => {
    const colors = {
      'TODO': '#6c757d',      // Gray - To Do
      'DOING': '#007bff',     // Blue - In Progress
      'DONE': '#28a745',      // Green - Completed
      'DELAY': '#ffc107',     // Yellow - Delayed
      'CANCEL': '#dc3545',    // Red - Cancelled
    };
    return colors[status] || '#6c757d';
  };

  const getStatusText = (status) => {
    const texts = {
      'TODO': 'To Do',
      'DOING': 'In Progress',
      'DONE': 'Completed',
      'DELAY': 'Delayed',
      'CANCEL': 'Cancelled',
    };
    return texts[status] || status;
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(task);
    }
  };

  return (
    <div className="task-card" onClick={handleClick}>
      <div className="task-card-header">
        <h4 className="task-title">{task.title}</h4>
        <span 
          className="task-status"
          style={{ backgroundColor: getStatusColor(task.status) }}
        >
          {getStatusText(task.status)}
        </span>
      </div>
      {task.description && (
        <p className="task-description">{task.description}</p>
      )}
      {task.type && (
        <div className="task-meta">
          <span className="task-category">{task.type.name}</span>
        </div>
      )}
      {task.plannedStartTime && (
        <div className="task-time">
          <small>
            {new Date(task.plannedStartTime).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </small>
        </div>
      )}
    </div>
  );
}

export default TaskCard;

