import React from 'react';
import TaskCard from './TaskCard';
import './QuadrantPanel.css';

/**
 * 单个象限面板
 * @param {number} quadrant - 象限编号 (1-4)
 * @param {string} title - 象限标题
 * @param {array} tasks - 该象限的任务列表
 * @param {function} onTaskClick - 任务点击回调
 */
function QuadrantPanel({ quadrant, title, tasks = [], onTaskClick }) {
  return (
    <div className="quadrant-panel">
      <div className="quadrant-header">
        <h3>{title}</h3>
        <span className="quadrant-number">象限 {quadrant}</span>
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

