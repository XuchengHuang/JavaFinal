import React, { useState } from 'react';
import './StatusChangeModal.css';

/**
 * 状态切换模态框
 * @param {boolean} isOpen - 是否打开
 * @param {object} task - 当前任务
 * @param {function} onClose - 关闭回调
 * @param {function} onStatusChange - 状态改变回调
 * @param {function} onDelete - 删除回调
 */
function StatusChangeModal({ isOpen, task, onClose, onStatusChange, onDelete }) {
  const [selectedStatus, setSelectedStatus] = useState(task?.status || 'TODO');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !task) return null;

  // 检查任务是否不可修改状态（已完成、延期、已取消）
  const isStatusLocked = task.status === 'DONE' || task.status === 'DELAY' || task.status === 'CANCEL';
  
  // 检查是否可以从当前状态直接变为DONE（TODO状态不能直接变为DONE）
  const canChangeToDone = task.status !== 'TODO';
  
  // 检查是否可以从当前状态变为TODO（DOING状态不能变为TODO）
  const canChangeToTodo = task.status !== 'DOING';

  const statusOptions = [
    { value: 'TODO', label: '待办', color: '#6c757d', disabled: !canChangeToTodo },
    { value: 'DOING', label: '进行中', color: '#007bff' },
    { value: 'DONE', label: '已完成', color: '#28a745', disabled: !canChangeToDone },
    { value: 'DELAY', label: '延期', color: '#ffc107' },
    { value: 'CANCEL', label: '已取消', color: '#dc3545' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedStatus === task.status) {
      onClose();
      return;
    }

    // 验证：TODO状态不能直接变为DONE
    if (task.status === 'TODO' && selectedStatus === 'DONE') {
      alert('待办任务需要先变为"进行中"状态，才能标记为"已完成"');
      return;
    }

    // 验证：DOING状态不能变为TODO
    if (task.status === 'DOING' && selectedStatus === 'TODO') {
      alert('进行中的任务不能改回"待办"状态');
      return;
    }

    setLoading(true);
    try {
      await onStatusChange(task.id, selectedStatus);
      onClose();
    } catch (error) {
      console.error('更新状态失败:', error);
      alert('更新状态失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="status-modal-overlay" onClick={onClose}>
      <div className="status-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="status-modal-header">
          <h3>更改任务状态</h3>
          <div className="header-actions">
            {onDelete && (
              <button
                className="delete-btn"
                onClick={() => onDelete(task)}
                title="删除任务"
                disabled={loading}
              >
                🗑️
              </button>
            )}
            <button className="status-modal-close" onClick={onClose}>×</button>
          </div>
        </div>
        <div className="status-modal-body">
          <div className="task-info">
            <h4>{task.title}</h4>
            <p className="current-status">
              当前状态: <span style={{ color: statusOptions.find(s => s.value === task.status)?.color }}>
                {statusOptions.find(s => s.value === task.status)?.label}
              </span>
            </p>
          </div>
          {isStatusLocked ? (
            <div className="status-locked-message">
              <p>该任务状态已锁定，无法修改。</p>
              <p className="locked-reason">
                {task.status === 'DONE' && '已完成的任务状态不可更改'}
                {task.status === 'DELAY' && '延期的任务状态不可更改'}
                {task.status === 'CANCEL' && '已取消的任务状态不可更改'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {task.status === 'TODO' && (
                <div className="status-warning-message" style={{
                  padding: '10px',
                  marginBottom: '15px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '4px',
                  color: '#856404',
                  fontSize: '14px'
                }}>
                  <p style={{ margin: 0 }}>⚠️ 待办任务需要先变为"进行中"状态，才能标记为"已完成"</p>
                </div>
              )}
              {task.status === 'DOING' && (
                <div className="status-warning-message" style={{
                  padding: '10px',
                  marginBottom: '15px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '4px',
                  color: '#856404',
                  fontSize: '14px'
                }}>
                  <p style={{ margin: 0 }}>⚠️ 进行中的任务不能改回"待办"状态</p>
                </div>
              )}
              <div className="status-options">
                {statusOptions.map((option) => {
                  const isDisabled = option.disabled || false;
                  return (
                    <label
                      key={option.value}
                      className={`status-option ${selectedStatus === option.value ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                      style={{
                        borderColor: selectedStatus === option.value ? option.color : '#ddd',
                        backgroundColor: selectedStatus === option.value ? `${option.color}15` : 'white',
                        opacity: isDisabled ? 0.5 : 1,
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={option.value}
                        checked={selectedStatus === option.value}
                        onChange={(e) => !isDisabled && setSelectedStatus(e.target.value)}
                        disabled={isDisabled}
                      />
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: option.color }}
                      >
                        {option.label}
                      </span>
                      {isDisabled && (
                        <span style={{ fontSize: '12px', color: '#999', marginLeft: '5px' }}>
                          (不可用)
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
              <div className="status-modal-actions">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-cancel"
                  disabled={loading}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn-confirm"
                  disabled={loading || selectedStatus === task.status || (task.status === 'TODO' && selectedStatus === 'DONE') || (task.status === 'DOING' && selectedStatus === 'TODO')}
                  style={{ backgroundColor: statusOptions.find(s => s.value === selectedStatus)?.color }}
                >
                  {loading ? '更新中...' : '确认'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatusChangeModal;

