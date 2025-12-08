import React from 'react';
import './TaskCard.css';

/**
 * 任务卡片组件
 * @param {object} task - 任务对象
 * @param {function} onClick - 点击回调
 */
function TaskCard({ task, onClick }) {
  const getStatusColor = (status) => {
    const colors = {
      'TODO': '#6c757d',      // 灰色 - 待办
      'DOING': '#007bff',     // 蓝色 - 进行中
      'DONE': '#28a745',      // 绿色 - 已完成
      'DELAY': '#ffc107',     // 黄色 - 延期
      'CANCEL': '#dc3545',    // 红色 - 已取消
    };
    return colors[status] || '#6c757d';
  };

  const getStatusText = (status) => {
    const texts = {
      'TODO': '待办',
      'DOING': '进行中',
      'DONE': '已完成',
      'DELAY': '延期',
      'CANCEL': '已取消',
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
            {new Date(task.plannedStartTime).toLocaleString('zh-CN', {
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

