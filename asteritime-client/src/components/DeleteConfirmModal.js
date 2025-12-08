import React from 'react';
import './DeleteConfirmModal.css';

/**
 * 删除确认模态框
 * @param {boolean} isOpen - 是否打开
 * @param {object} task - 要删除的任务
 * @param {function} onClose - 关闭回调
 * @param {function} onConfirm - 确认删除回调
 * @param {boolean} loading - 是否正在删除
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
          <h3>确认删除</h3>
        </div>
        <div className="delete-modal-body">
          <p>确定要删除任务 <strong>"{task.title}"</strong> 吗？</p>
          <p className="warning-text">此操作无法撤销，任务将从数据库中永久删除。</p>
        </div>
        <div className="delete-modal-actions">
          <button
            type="button"
            onClick={onClose}
            className="btn-cancel"
            disabled={loading}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn-delete"
            disabled={loading}
          >
            {loading ? '删除中...' : '确认删除'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;

