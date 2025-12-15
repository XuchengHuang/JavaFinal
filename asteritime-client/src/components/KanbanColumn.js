import React from 'react';
import KanbanTaskItem from './KanbanTaskItem';
import './KanbanColumn.css';

/**
 * Kanban column
 * @param {string} title - Column title
 * @param {array} tasks - Task list for this column
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

