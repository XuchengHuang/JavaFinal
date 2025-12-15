import React, { useState } from 'react';
import './StatusChangeModal.css';

/**
 * Status change modal
 * @param {boolean} isOpen - Whether to open
 * @param {object} task - Current task
 * @param {function} onClose - Close callback
 * @param {function} onStatusChange - Status change callback
 * @param {function} onDelete - Delete callback
 */
function StatusChangeModal({ isOpen, task, onClose, onStatusChange, onDelete }) {
  const [selectedStatus, setSelectedStatus] = useState(task?.status || 'TODO');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !task) return null;

  // Check if task status is locked (completed, delayed, cancelled)
  const isStatusLocked = task.status === 'DONE' || task.status === 'DELAY' || task.status === 'CANCEL';
  
  // Check if can change directly to DONE (TODO status cannot change directly to DONE)
  const canChangeToDone = task.status !== 'TODO';
  
  // Check if can change to TODO (DOING status cannot change to TODO)
  const canChangeToTodo = task.status !== 'DOING';

  const statusOptions = [
    { value: 'TODO', label: 'To Do', color: '#6c757d', disabled: !canChangeToTodo },
    { value: 'DOING', label: 'In Progress', color: '#007bff' },
    { value: 'DONE', label: 'Completed', color: '#28a745', disabled: !canChangeToDone },
    { value: 'DELAY', label: 'Delayed', color: '#ffc107' },
    { value: 'CANCEL', label: 'Cancelled', color: '#dc3545' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedStatus === task.status) {
      onClose();
      return;
    }

    // Validation: TODO status cannot change directly to DONE
    if (task.status === 'TODO' && selectedStatus === 'DONE') {
      alert('Task in TODO status must be changed to DOING status first before marking as DONE');
      return;
    }

    // Validation: DOING status cannot change to TODO
    if (task.status === 'DOING' && selectedStatus === 'TODO') {
      alert('Task in DOING status cannot be changed back to TODO status');
      return;
    }

    setLoading(true);
    try {
      await onStatusChange(task.id, selectedStatus);
      onClose();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status, please try again later');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="status-modal-overlay" onClick={onClose}>
      <div className="status-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="status-modal-header">
          <h3>Change Task Status</h3>
          <div className="header-actions">
            {onDelete && (
              <button
                className="delete-btn"
                onClick={() => onDelete(task)}
                title="Delete task"
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
              Current Status: <span style={{ color: statusOptions.find(s => s.value === task.status)?.color }}>
                {statusOptions.find(s => s.value === task.status)?.label}
              </span>
            </p>
          </div>
          {isStatusLocked ? (
            <div className="status-locked-message">
              <p>This task status is locked and cannot be modified.</p>
              <p className="locked-reason">
                {task.status === 'DONE' && 'Completed task status cannot be changed'}
                {task.status === 'DELAY' && 'Delayed task status cannot be changed'}
                {task.status === 'CANCEL' && 'Cancelled task status cannot be changed'}
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
                  <p style={{ margin: 0 }}>⚠️ Task in TODO status must be changed to DOING status first before marking as DONE</p>
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
                  <p style={{ margin: 0 }}>⚠️ Task in DOING status cannot be changed back to TODO status</p>
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
                          (Unavailable)
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-confirm"
                  disabled={loading || selectedStatus === task.status || (task.status === 'TODO' && selectedStatus === 'DONE') || (task.status === 'DOING' && selectedStatus === 'TODO')}
                  style={{ backgroundColor: statusOptions.find(s => s.value === selectedStatus)?.color }}
                >
                  {loading ? 'Updating...' : 'Confirm'}
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

