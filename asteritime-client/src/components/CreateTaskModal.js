import React, { useState, useEffect } from 'react';
import { getTaskCategories, getRecurrenceRules, createTask, createTaskCategory, createRecurrenceRule } from '../api/task';
import './CreateTaskModal.css';

function CreateTaskModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quadrant: 1,
    type: '',
    recurrenceRule: '',
    plannedStartTime: '',
    plannedEndTime: '',
  });

  const [categories, setCategories] = useState([]);
  const [recurrenceRules, setRecurrenceRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(true);
  
  // 小弹窗状态
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [recurrenceCount, setRecurrenceCount] = useState('1');
  const [recurrenceUnit, setRecurrenceUnit] = useState('day');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingRecurrence, setCreatingRecurrence] = useState(false);

  // 加载选项数据
  useEffect(() => {
    if (isOpen) {
      loadOptions();
    }
  }, [isOpen]);

  const loadOptions = async () => {
    setLoadingOptions(true);
    try {
      const [cats, rules] = await Promise.all([
        getTaskCategories(),
        getRecurrenceRules(),
      ]);
      setCategories(cats);
      setRecurrenceRules(rules);
    } catch (err) {
      console.error('加载选项失败:', err);
      setError('加载选项失败，请刷新页面重试');
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 构建请求数据
      const taskData = {
        title: formData.title,
        quadrant: parseInt(formData.quadrant),
        status: 'TODO', // 新建任务默认为TODO状态
      };

      // 可选字段
      if (formData.description) {
        taskData.description = formData.description;
      }
      if (formData.type) {
        taskData.type = { id: parseInt(formData.type) };
      }
      if (formData.recurrenceRule) {
        taskData.recurrenceRule = { id: parseInt(formData.recurrenceRule) };
      }
      // 转换 datetime-local 格式为 ISO 8601 格式
      if (formData.plannedStartTime) {
        // datetime-local 格式: "2025-12-07T14:30" (没有秒数)
        // 需要转换为: "2025-12-07T14:30:00"
        const startTime = formData.plannedStartTime.includes(':') && 
                          formData.plannedStartTime.split(':').length === 2
                          ? formData.plannedStartTime + ':00'
                          : formData.plannedStartTime;
        taskData.plannedStartTime = startTime;
      }
      if (formData.plannedEndTime) {
        const endTime = formData.plannedEndTime.includes(':') && 
                       formData.plannedEndTime.split(':').length === 2
                       ? formData.plannedEndTime + ':00'
                       : formData.plannedEndTime;
        taskData.plannedEndTime = endTime;
      }

      await createTask(taskData);
      
      // 重置表单
      setFormData({
        title: '',
        description: '',
        quadrant: 1,
        type: '',
        recurrenceRule: '',
        plannedStartTime: '',
        plannedEndTime: '',
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || '创建任务失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 创建任务类别
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      return;
    }
    
    setCreatingCategory(true);
    try {
      const newCategory = await createTaskCategory(categoryName.trim());
      setCategories([...categories, newCategory]);
      setFormData(prev => ({ ...prev, type: newCategory.id.toString() }));
      setCategoryName('');
      setShowCategoryModal(false);
    } catch (err) {
      alert(err.message || '创建任务类别失败');
    } finally {
      setCreatingCategory(false);
    }
  };

  // 创建重复规则
  const handleCreateRecurrence = async (e) => {
    e.preventDefault();
    const frequencyExpression = `${recurrenceCount}/${recurrenceUnit}`;
    
    setCreatingRecurrence(true);
    try {
      const newRule = await createRecurrenceRule(frequencyExpression);
      setRecurrenceRules([...recurrenceRules, newRule]);
      setFormData(prev => ({ ...prev, recurrenceRule: newRule.id.toString() }));
      setRecurrenceCount('1');
      setRecurrenceUnit('day');
      setShowRecurrenceModal(false);
    } catch (err) {
      alert(err.message || '创建重复规则失败');
    } finally {
      setCreatingRecurrence(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>创建新任务</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="task-form">
          {error && <div className="form-error">{error}</div>}

          {/* 任务标题 */}
          <div className="form-group">
            <label htmlFor="title">任务标题 *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="请输入任务标题"
              disabled={loading}
            />
          </div>

          {/* 任务描述 */}
          <div className="form-group">
            <label htmlFor="description">任务描述</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="请输入任务描述（可选）"
              rows="3"
              disabled={loading}
            />
          </div>

          {/* 四象限 */}
          <div className="form-group">
            <label htmlFor="quadrant">四象限 *</label>
            <select
              id="quadrant"
              name="quadrant"
              value={formData.quadrant}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value={1}>象限 1: Urgent & Important</option>
              <option value={2}>象限 2: Not Urgent & Important</option>
              <option value={3}>象限 3: Urgent & Not Important</option>
              <option value={4}>象限 4: Not Urgent & Not Important</option>
            </select>
          </div>

          {/* 任务类别 */}
          <div className="form-group">
            <label htmlFor="type">任务类别</label>
            <div className="form-group-with-button">
              {loadingOptions ? (
                <select disabled>
                  <option>加载中...</option>
                </select>
              ) : (
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  disabled={loading || categories.length === 0}
                >
                  <option value="">无（可选）</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                className="btn-add"
                onClick={() => setShowCategoryModal(true)}
                disabled={loading || loadingOptions}
                title="创建新类别"
              >
                +
              </button>
            </div>
            {categories.length === 0 && !loadingOptions && (
              <span className="form-hint">暂无类别，可在设置中创建</span>
            )}
          </div>

          {/* 重复规则 */}
          <div className="form-group">
            <label htmlFor="recurrenceRule">重复规则</label>
            <div className="form-group-with-button">
              {loadingOptions ? (
                <select disabled>
                  <option>加载中...</option>
                </select>
              ) : (
                <select
                  id="recurrenceRule"
                  name="recurrenceRule"
                  value={formData.recurrenceRule}
                  onChange={handleChange}
                  disabled={loading || recurrenceRules.length === 0}
                >
                  <option value="">无（可选）</option>
                  {recurrenceRules.map((rule) => (
                    <option key={rule.id} value={rule.id}>
                      {rule.frequencyExpression}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                className="btn-add"
                onClick={() => setShowRecurrenceModal(true)}
                disabled={loading || loadingOptions}
                title="创建新规则"
              >
                +
              </button>
            </div>
            {recurrenceRules.length === 0 && !loadingOptions && (
              <span className="form-hint">暂无重复规则，可在设置中创建</span>
            )}
          </div>

          {/* 计划开始时间 */}
          <div className="form-group">
            <label htmlFor="plannedStartTime">计划开始时间</label>
            <input
              type="datetime-local"
              id="plannedStartTime"
              name="plannedStartTime"
              value={formData.plannedStartTime}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          {/* 计划结束时间 */}
          <div className="form-group">
            <label htmlFor="plannedEndTime">计划结束时间</label>
            <input
              type="datetime-local"
              id="plannedEndTime"
              name="plannedEndTime"
              value={formData.plannedEndTime}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-actions">
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
              className="btn-submit"
              disabled={loading}
            >
              {loading ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>

      {/* 创建任务类别小弹窗 */}
      {showCategoryModal && (
        <div className="small-modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="small-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="small-modal-header">
              <h3>创建任务类别</h3>
              <button className="small-modal-close" onClick={() => setShowCategoryModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateCategory} className="small-modal-form">
              <div className="form-group">
                <label htmlFor="categoryName">类别名称 *</label>
                <input
                  type="text"
                  id="categoryName"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="请输入类别名称"
                  required
                  disabled={creatingCategory}
                  autoFocus
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="btn-cancel"
                  disabled={creatingCategory}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={creatingCategory}
                >
                  {creatingCategory ? '创建中...' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 创建重复规则小弹窗 */}
      {showRecurrenceModal && (
        <div className="small-modal-overlay" onClick={() => setShowRecurrenceModal(false)}>
          <div className="small-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="small-modal-header">
              <h3>创建重复规则</h3>
              <button className="small-modal-close" onClick={() => setShowRecurrenceModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateRecurrence} className="small-modal-form">
              <div className="form-group">
                <label htmlFor="recurrenceCount">重复次数 *</label>
                <select
                  id="recurrenceCount"
                  value={recurrenceCount}
                  onChange={(e) => setRecurrenceCount(e.target.value)}
                  disabled={creatingRecurrence}
                >
                  <option value="1">一次</option>
                  <option value="2">两次</option>
                  <option value="3">三次</option>
                  <option value="4">四次</option>
                  <option value="5">五次</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="recurrenceUnit">时间单位 *</label>
                <select
                  id="recurrenceUnit"
                  value={recurrenceUnit}
                  onChange={(e) => setRecurrenceUnit(e.target.value)}
                  disabled={creatingRecurrence}
                >
                  <option value="day">天</option>
                  <option value="week">周</option>
                  <option value="month">月</option>
                </select>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowRecurrenceModal(false)}
                  className="btn-cancel"
                  disabled={creatingRecurrence}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={creatingRecurrence}
                >
                  {creatingRecurrence ? '创建中...' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateTaskModal;

