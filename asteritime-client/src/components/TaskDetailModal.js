import React from 'react';
import './TaskDetailModal.css';

function TaskDetailModal({ isOpen, task, onClose }) {
  if (!isOpen || !task) return null;

  const formatDateTime = (dateString) => {
    if (!dateString) return '未设置';
    // 如果时间字符串不包含时区信息，将其当作本地时间处理
    // 格式：YYYY-MM-DDTHH:mm:ss 或 YYYY-MM-DD HH:mm:ss
    let date;
    if (dateString.includes('T')) {
      // ISO 格式，如果没有时区信息，当作本地时间
      if (dateString.endsWith('Z') || dateString.includes('+') || dateString.includes('-', 10)) {
        // 有时区信息，使用标准解析
        date = new Date(dateString);
      } else {
        // 没有时区信息，当作本地时间处理
        const [datePart, timePart] = dateString.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes, seconds] = (timePart || '00:00:00').split(':').map(Number);
        date = new Date(year, month - 1, day, hours, minutes, seconds || 0);
      }
    } else {
      // 其他格式，尝试标准解析
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
      TODO: '待办',
      DOING: '进行中',
      DONE: '已完成',
      DELAY: '延期',
      CANCEL: '已取消',
    };
    return labels[status] || status;
  };

  const getQuadrantLabel = (quadrant) => {
    const labels = {
      1: '象限 1: Urgent & Important',
      2: '象限 2: Not Urgent & Important',
      3: '象限 3: Urgent & Not Important',
      4: '象限 4: Not Urgent & Not Important',
    };
    return labels[quadrant] || `象限 ${quadrant}`;
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
          <h2>任务详情</h2>
          <button className="task-detail-close" onClick={onClose}>×</button>
        </div>
        <div className="task-detail-body">
          <div className="detail-item">
            <label>任务标题</label>
            <div className="detail-value">{task.title}</div>
          </div>

          {task.description && (
            <div className="detail-item">
              <label>任务描述</label>
              <div className="detail-value">{task.description}</div>
            </div>
          )}

          <div className="detail-item">
            <label>象限</label>
            <div className="detail-value">{getQuadrantLabel(task.quadrant)}</div>
          </div>

          <div className="detail-item">
            <label>状态</label>
            <div className="detail-value">
              <span
                className="status-badge"
                style={{ backgroundColor: getStatusColor(task.status) }}
              >
                {getStatusLabel(task.status)}
              </span>
            </div>
          </div>

          {/* 计划时间 */}
          {task.plannedStartTime && (
            <div className="detail-item">
              <label>计划开始时间</label>
              <div className="detail-value">{formatDateTime(task.plannedStartTime)}</div>
            </div>
          )}

          {task.plannedEndTime && (
            <div className="detail-item">
              <label>计划结束时间</label>
              <div className="detail-value">{formatDateTime(task.plannedEndTime)}</div>
            </div>
          )}

          {/* 实际时间（仅对已完成、延期、已取消的任务显示） */}
          {(task.status === 'DONE' || task.status === 'DELAY' || task.status === 'CANCEL') && (
            <>
              {task.actualStartTime && (
                <div className="detail-item">
                  <label>实际开始时间</label>
                  <div className="detail-value">{formatDateTime(task.actualStartTime)}</div>
                </div>
              )}

              {task.actualEndTime && (
                <div className="detail-item">
                  <label>实际完成时间</label>
                  <div className="detail-value">{formatDateTime(task.actualEndTime)}</div>
                </div>
              )}
            </>
          )}

          {task.type && (
            <div className="detail-item">
              <label>任务类别</label>
              <div className="detail-value">{task.type.name || '未分类'}</div>
            </div>
          )}

          {task.recurrenceRule && (
            <div className="detail-item">
              <label>重复规则</label>
              <div className="detail-value">{task.recurrenceRule.frequencyExpression || '无'}</div>
            </div>
          )}
        </div>
        <div className="task-detail-footer">
          <button className="btn-close" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}

export default TaskDetailModal;

