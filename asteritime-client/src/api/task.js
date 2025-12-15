import { authenticatedFetch } from './auth';

import { API_BASE_URL } from '../config/api';

/**
 * Get all task categories
 * @returns {Promise<TaskCategory[]>}
 */
export const getTaskCategories = async () => {
  const response = await authenticatedFetch(`${API_BASE_URL}/task-categories`);
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Failed to get task categories (${response.status})`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error) {
        errorMessage = errorJson.error;
      }
    } catch (e) {
      // If response is not JSON, use the text as error message
      if (errorText) {
        errorMessage = errorText;
      }
    }
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }
  return await response.json();
};

/**
 * Get all recurrence rules
 * @returns {Promise<TaskRecurrenceRule[]>}
 */
export const getRecurrenceRules = async () => {
  const response = await authenticatedFetch(`${API_BASE_URL}/task-recurrence-rules`);
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Failed to get recurrence rules (${response.status})`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error) {
        errorMessage = errorJson.error;
      }
    } catch (e) {
      // If response is not JSON, use the text as error message
      if (errorText) {
        errorMessage = errorText;
      }
    }
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }
  return await response.json();
};

/**
 * Create a task
 * @param {object} taskData - Task data
 * @returns {Promise<Task>}
 */
export const createTask = async (taskData) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create task: ${errorText}`);
  }

  return await response.json();
};

/**
 * Get task list
 * @param {object} filters - Query filters
 * @returns {Promise<Task[]>}
 */
export const getTasks = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.quadrant) params.append('quadrant', filters.quadrant);
  if (filters.categoryId) params.append('categoryId', filters.categoryId);
  if (filters.status) params.append('status', filters.status);
  if (filters.startTime) params.append('startTime', filters.startTime);
  if (filters.endTime) params.append('endTime', filters.endTime);

  const url = `${API_BASE_URL}/tasks${params.toString() ? '?' + params.toString() : ''}`;
  const response = await authenticatedFetch(url);

  if (!response.ok) {
    throw new Error('Failed to get task list');
  }

  return await response.json();
};

/**
 * Update a task
 * @param {number} taskId - Task ID
 * @param {object} taskData - Task data to update
 * @returns {Promise<Task>}
 */
export const updateTask = async (taskId, taskData) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update task: ${errorText}`);
  }

  return await response.json();
};

/**
 * Delete a task
 * @param {number} taskId - Task ID
 * @returns {Promise<void>}
 */
export const deleteTask = async (taskId) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete task: ${errorText}`);
  }

  return;
};

/**
 * Create a task category
 * @param {string} name - Category name
 * @returns {Promise<TaskCategory>}
 */
export const createTaskCategory = async (name) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/task-categories`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create task category: ${errorText}`);
  }

  return await response.json();
};

/**
 * Create a recurrence rule
 * @param {string} frequencyExpression - Frequency expression, e.g. "1/day", "2/week"
 * @returns {Promise<TaskRecurrenceRule>}
 */
export const createRecurrenceRule = async (frequencyExpression) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/task-recurrence-rules`, {
    method: 'POST',
    body: JSON.stringify({ frequencyExpression }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create recurrence rule: ${errorText}`);
  }

  return await response.json();
};

