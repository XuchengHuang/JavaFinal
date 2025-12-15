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
  
  // Small modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [recurrenceCount, setRecurrenceCount] = useState('1');
  const [recurrenceUnit, setRecurrenceUnit] = useState('day');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingRecurrence, setCreatingRecurrence] = useState(false);

  // Load options data
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
      console.error('Failed to load options:', err);
      setError('Failed to load options, please refresh and try again');
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
      // Build request data
      const taskData = {
        title: formData.title,
        quadrant: parseInt(formData.quadrant),
        status: 'TODO', // New tasks default to TODO status
      };

      // Optional fields
      if (formData.description) {
        taskData.description = formData.description;
      }
      if (formData.type) {
        taskData.type = { id: parseInt(formData.type) };
      }
      if (formData.recurrenceRule) {
        taskData.recurrenceRule = { id: parseInt(formData.recurrenceRule) };
      }
      // Convert datetime-local format to ISO 8601 format
      if (formData.plannedStartTime) {
        // datetime-local format: "2025-12-07T14:30" (no seconds)
        // Need to convert to: "2025-12-07T14:30:00"
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
      
      // Reset form
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
      setError(err.message || 'Failed to create task, please try again later');
    } finally {
      setLoading(false);
    }
  };

  // Create task category
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
      alert(err.message || 'Failed to create task category');
    } finally {
      setCreatingCategory(false);
    }
  };

  // Create recurrence rule
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
      alert(err.message || 'Failed to create recurrence rule');
    } finally {
      setCreatingRecurrence(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Task</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="task-form">
          {error && <div className="form-error">{error}</div>}

          {/* Task Title */}
          <div className="form-group">
            <label htmlFor="title">Task Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter task title"
              disabled={loading}
            />
          </div>

          {/* Task Description */}
          <div className="form-group">
            <label htmlFor="description">Task Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter task description (optional)"
              rows="3"
              disabled={loading}
            />
          </div>

          {/* Quadrant */}
          <div className="form-group">
            <label htmlFor="quadrant">Quadrant *</label>
            <select
              id="quadrant"
              name="quadrant"
              value={formData.quadrant}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value={1}>Quadrant 1: Urgent & Important</option>
              <option value={2}>Quadrant 2: Not Urgent & Important</option>
              <option value={3}>Quadrant 3: Urgent & Not Important</option>
              <option value={4}>Quadrant 4: Not Urgent & Not Important</option>
            </select>
          </div>

          {/* Task Category */}
          <div className="form-group">
            <label htmlFor="type">Task Category</label>
            <div className="form-group-with-button">
              {loadingOptions ? (
                <select disabled>
                  <option>Loading...</option>
                </select>
              ) : (
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  disabled={loading || categories.length === 0}
                >
                  <option value="">None (optional)</option>
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
                title="Create new category"
              >
                +
              </button>
            </div>
            {categories.length === 0 && !loadingOptions && (
              <span className="form-hint">No categories available, can create in settings</span>
            )}
          </div>

          {/* Recurrence Rule */}
          <div className="form-group">
            <label htmlFor="recurrenceRule">Recurrence Rule</label>
            <div className="form-group-with-button">
              {loadingOptions ? (
                <select disabled>
                  <option>Loading...</option>
                </select>
              ) : (
                <select
                  id="recurrenceRule"
                  name="recurrenceRule"
                  value={formData.recurrenceRule}
                  onChange={handleChange}
                  disabled={loading || recurrenceRules.length === 0}
                >
                  <option value="">None (optional)</option>
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
                title="Create new rule"
              >
                +
              </button>
            </div>
            {recurrenceRules.length === 0 && !loadingOptions && (
              <span className="form-hint">No recurrence rules available, can create in settings</span>
            )}
          </div>

          {/* Planned Start Time */}
          <div className="form-group">
            <label htmlFor="plannedStartTime">Planned Start Time</label>
            <input
              type="datetime-local"
              id="plannedStartTime"
              name="plannedStartTime"
              value={formData.plannedStartTime}
              onChange={handleChange}
              disabled={loading}
              lang="en"
            />
          </div>

          {/* Planned End Time */}
          <div className="form-group">
            <label htmlFor="plannedEndTime">Planned End Time</label>
            <input
              type="datetime-local"
              id="plannedEndTime"
              name="plannedEndTime"
              value={formData.plannedEndTime}
              onChange={handleChange}
              disabled={loading}
              lang="en"
            />
          </div>

          <div className="form-actions">
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
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>

      {/* Create task category small modal */}
      {showCategoryModal && (
        <div className="small-modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="small-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="small-modal-header">
              <h3>Create Task Category</h3>
              <button className="small-modal-close" onClick={() => setShowCategoryModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateCategory} className="small-modal-form">
              <div className="form-group">
                <label htmlFor="categoryName">Category Name *</label>
                <input
                  type="text"
                  id="categoryName"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Enter category name"
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={creatingCategory}
                >
                  {creatingCategory ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create recurrence rule small modal */}
      {showRecurrenceModal && (
        <div className="small-modal-overlay" onClick={() => setShowRecurrenceModal(false)}>
          <div className="small-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="small-modal-header">
              <h3>Create Recurrence Rule</h3>
              <button className="small-modal-close" onClick={() => setShowRecurrenceModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateRecurrence} className="small-modal-form">
              <div className="form-group">
                <label htmlFor="recurrenceCount">Repeat Count *</label>
                <select
                  id="recurrenceCount"
                  value={recurrenceCount}
                  onChange={(e) => setRecurrenceCount(e.target.value)}
                  disabled={creatingRecurrence}
                >
                  <option value="1">Once</option>
                  <option value="2">Twice</option>
                  <option value="3">Three times</option>
                  <option value="4">Four times</option>
                  <option value="5">Five times</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="recurrenceUnit">Time Unit *</label>
                <select
                  id="recurrenceUnit"
                  value={recurrenceUnit}
                  onChange={(e) => setRecurrenceUnit(e.target.value)}
                  disabled={creatingRecurrence}
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowRecurrenceModal(false)}
                  className="btn-cancel"
                  disabled={creatingRecurrence}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={creatingRecurrence}
                >
                  {creatingRecurrence ? 'Creating...' : 'Create'}
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

