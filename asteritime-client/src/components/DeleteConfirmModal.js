import React from 'react';
import './DeleteConfirmModal.css';

/**
 * Delete confirmation modal
 * @param {boolean} isOpen - Whether to open
 * @param {object} task - Task to delete
 * @param {function} onClose - Close callback
 * @param {function} onConfirm - Confirm delete callback
 * @param {boolean} loading - Whether deleting
 */
function DeleteConfirmModal({ isOpen, task, onClose, onConfirm, loading }) {
  if (!isOpen || !task) return null;

  const handleConfirm = () => {
    onConfirm(task.id);
  };

  return (
    <div className="delete-modal-overlay" onClick={onClose}>
      <div className="delete-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="delete-modal-header">
          <h3>Confirm Delete</h3>
        </div>
        <div className="delete-modal-body">
          <p>Are you sure you want to delete task <strong>"{task.title}"</strong>?</p>
          <p className="warning-text">This action cannot be undone, the task will be permanently deleted from the database.</p>
        </div>
        <div className="delete-modal-actions">
          <button
            type="button"
            onClick={onClose}
            className="btn-cancel"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn-delete"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;

