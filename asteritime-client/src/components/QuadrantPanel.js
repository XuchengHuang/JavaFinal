import React from 'react';
import TaskCard from './TaskCard';
import './QuadrantPanel.css';

/**
 * Single quadrant panel
 * @param {number} quadrant - Quadrant number (1-4)
 * @param {string} title - Quadrant title
 * @param {array} tasks - Task list for this quadrant
 * @param {function} onTaskClick - Task click callback
 */
function QuadrantPanel({ quadrant, title, tasks = [], onTaskClick }) {
  return (
    <div className="quadrant-panel">
      <div className="quadrant-header">
        <h3>{title}</h3>
        <span className="quadrant-number">Quadrant {quadrant}</span>
      </div>
      <div className="quadrant-content">
        {tasks.length === 0 ? (
          <p className="placeholder-text">Tasks will appear here</p>
        ) : (
          <div className="task-list">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={onTaskClick} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default QuadrantPanel;

