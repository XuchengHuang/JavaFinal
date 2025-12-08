import { authenticatedFetch } from './auth';

const API_BASE_URL = 'http://localhost:8080/api';

/**
 * 获取所有任务类别
 * @returns {Promise<TaskCategory[]>}
 */
export const getTaskCategories = async () => {
  const response = await authenticatedFetch(`${API_BASE_URL}/task-categories`);
  if (!response.ok) {
    throw new Error('获取任务类别失败');
  }
  return await response.json();
};

/**
 * 获取所有重复规则
 * @returns {Promise<TaskRecurrenceRule[]>}
 */
export const getRecurrenceRules = async () => {
  const response = await authenticatedFetch(`${API_BASE_URL}/task-recurrence-rules`);
  if (!response.ok) {
    throw new Error('获取重复规则失败');
  }
  return await response.json();
};

/**
 * 创建任务
 * @param {object} taskData - 任务数据
 * @returns {Promise<Task>}
 */
export const createTask = async (taskData) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`创建任务失败: ${errorText}`);
  }

  return await response.json();
};

/**
 * 获取任务列表
 * @param {object} filters - 查询条件
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
    throw new Error('获取任务列表失败');
  }

  return await response.json();
};

/**
 * 更新任务
 * @param {number} taskId - 任务ID
 * @param {object} taskData - 要更新的任务数据
 * @returns {Promise<Task>}
 */
export const updateTask = async (taskId, taskData) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`更新任务失败: ${errorText}`);
  }

  return await response.json();
};

/**
 * 删除任务
 * @param {number} taskId - 任务ID
 * @returns {Promise<void>}
 */
export const deleteTask = async (taskId) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`删除任务失败: ${errorText}`);
  }

  // DELETE 请求成功返回 204 No Content，没有响应体
  return;
};

/**
 * 创建任务类别
 * @param {string} name - 类别名称
 * @returns {Promise<TaskCategory>}
 */
export const createTaskCategory = async (name) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/task-categories`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`创建任务类别失败: ${errorText}`);
  }

  return await response.json();
};

/**
 * 创建重复规则
 * @param {string} frequencyExpression - 频率表达式，如 "1/day", "2/week"
 * @returns {Promise<TaskRecurrenceRule>}
 */
export const createRecurrenceRule = async (frequencyExpression) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/task-recurrence-rules`, {
    method: 'POST',
    body: JSON.stringify({ frequencyExpression }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`创建重复规则失败: ${errorText}`);
  }

  return await response.json();
};

