import React from 'react';
import './TaskDetailModal.css';

function TaskDetailModal({ isOpen, task, onClose }) {
  if (!isOpen || !task) return null;

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not Set';
    // If time string does not contain timezone information, treat it as local time
    // Format: YYYY-MM-DDTHH:mm:ss or YYYY-MM-DD HH:mm:ss
    let date;
    if (dateString.includes('T')) {
      // ISO format, if no timezone information, treat as local time
      if (dateString.endsWith('Z') || dateString.includes('+') || dateString.includes('-', 10)) {
        // Has timezone information, use standard parsing
        date = new Date(dateString);
      } else {
        // No timezone information, treat as local time
        const [datePart, timePart] = dateString.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes, seconds] = (timePart || '00:00:00').split(':').map(Number);
        date = new Date(year, month - 1, day, hours, minutes, seconds || 0);
      }
    } else {
      // Other formats, try standard parsing
      date = new Date(dateString);
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const getStatusLabel = (status) => {
    const labels = {
      TODO: 'To Do',
      DOING: 'In Progress',
      DONE: 'Completed',
      DELAY: 'Delayed',
      CANCEL: 'Cancelled',
    };
    return labels[status] || status;
  };

  const getQuadrantLabel = (quadrant) => {
    const labels = {
      1: 'Quadrant 1: Urgent & Important',
      2: 'Quadrant 2: Not Urgent & Important',
      3: 'Quadrant 3: Urgent & Not Important',
      4: 'Quadrant 4: Not Urgent & Not Important',
    };
    return labels[quadrant] || `Quadrant ${quadrant}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      TODO: '#6c757d',
      DOING: '#007bff',
      DONE: '#28a745',
      DELAY: '#ffc107',
      CANCEL: '#dc3545',
    };
    return colors[status] || '#6c757d';
  };

  return (
    <div className="task-detail-overlay" onClick={onClose}>
      <div className="task-detail-content" onClick={(e) => e.stopPropagation()}>
        <div className="task-detail-header">
          <h2>Task Details</h2>
          <button className="task-detail-close" onClick={onClose}>×</button>
        </div>
        <div className="task-detail-body">
          <div className="detail-item">
            <label>Task Title</label>
            <div className="detail-value">{task.title}</div>
          </div>

          {task.description && (
            <div className="detail-item">
              <label>Task Description</label>
              <div className="detail-value">{task.description}</div>
            </div>
          )}

          <div className="detail-item">
            <label>Quadrant</label>
            <div className="detail-value">{getQuadrantLabel(task.quadrant)}</div>
          </div>

          <div className="detail-item">
            <label>Status</label>
            <div className="detail-value">
              <span
                className="status-badge"
                style={{ backgroundColor: getStatusColor(task.status) }}
              >
                {getStatusLabel(task.status)}
              </span>
            </div>
          </div>

          {/* Planned Time */}
          {task.plannedStartTime && (
            <div className="detail-item">
              <label>Planned Start Time</label>
              <div className="detail-value">{formatDateTime(task.plannedStartTime)}</div>
            </div>
          )}

          {task.plannedEndTime && (
            <div className="detail-item">
              <label>Planned End Time</label>
              <div className="detail-value">{formatDateTime(task.plannedEndTime)}</div>
            </div>
          )}

          {/* Actual Time (only shown for completed, delayed, cancelled tasks) */}
          {(task.status === 'DONE' || task.status === 'DELAY' || task.status === 'CANCEL') && (
            <>
              {task.actualStartTime && (
                <div className="detail-item">
                  <label>Actual Start Time</label>
                  <div className="detail-value">{formatDateTime(task.actualStartTime)}</div>
                </div>
              )}

              {task.actualEndTime && (
                <div className="detail-item">
                  <label>Actual Completion Time</label>
                  <div className="detail-value">{formatDateTime(task.actualEndTime)}</div>
                </div>
              )}
            </>
          )}

          {task.type && (
            <div className="detail-item">
              <label>Task Category</label>
              <div className="detail-value">{task.type.name || 'Uncategorized'}</div>
            </div>
          )}

          {task.recurrenceRule && (
            <div className="detail-item">
              <label>Recurrence Rule</label>
              <div className="detail-value">{task.recurrenceRule.frequencyExpression || 'None'}</div>
            </div>
          )}
        </div>
        <div className="task-detail-footer">
          <button className="btn-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default TaskDetailModal;

