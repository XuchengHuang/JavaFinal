import React from 'react';
import KanbanTaskItem from './KanbanTaskItem';
import './KanbanColumn.css';

/**
 * Kanban 列
 * @param {string} title - 列标题
 * @param {array} tasks - 该列的任务列表
 */
function KanbanColumn({ title, tasks = [] }) {
  return (
    <div className="kanban-column">
      <div className="kanban-header">
        <h3>{title}</h3>
      </div>
      <div className="kanban-content">
        {tasks.length === 0 ? (
          <p className="placeholder-text">Tasks</p>
        ) : (
          <div className="kanban-task-list">
            {tasks.map((task) => (
              <KanbanTaskItem key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default KanbanColumn;

