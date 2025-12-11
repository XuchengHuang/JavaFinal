import { authenticatedFetch } from './auth';

const API_BASE_URL = 'http://localhost:8080/api';

/**
 * 创建新的日记条目
 * @param {Object} journalData - 日记数据
 * @returns {Promise<JournalEntry>}
 */
export const createJournalEntry = async (journalData) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/journal-entries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(journalData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`创建日记失败: ${errorText}`);
  }

  return await response.json();
};

/**
 * 根据ID获取日记条目
 * @param {number} id - 日记ID
 * @returns {Promise<JournalEntry>}
 */
export const getJournalEntryById = async (id) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/journal-entries/${id}`);
  if (!response.ok) {
    throw new Error('获取日记失败');
  }
  return await response.json();
};

/**
 * 获取当前用户的所有日记（按日期倒序）
 * @returns {Promise<JournalEntry[]>}
 */
export const getAllJournalEntries = async () => {
  const response = await authenticatedFetch(`${API_BASE_URL}/journal-entries`);
  if (!response.ok) {
    let errorMessage = '获取日记列表失败';
    try {
      const errorText = await response.text();
      if (errorText) {
        errorMessage += `: ${errorText}`;
      }
    } catch (e) {
      // 忽略解析错误
    }
    if (response.status === 401) {
      errorMessage = '未授权，请重新登录';
    } else if (response.status === 500) {
      errorMessage = '服务器错误，请稍后重试';
    }
    throw new Error(errorMessage);
  }
  return await response.json();
};

/**
 * 按日期获取日记条目（返回该天的所有日记）
 * @param {string} date - 日期字符串，格式：YYYY-MM-DD
 * @returns {Promise<JournalEntry[]>}
 */
export const getJournalEntriesByDate = async (date) => {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/journal-entries/by-date?date=${date}`
  );
  if (!response.ok) {
    let errorMessage = '获取日记失败';
    try {
      const errorText = await response.text();
      if (errorText) {
        errorMessage += `: ${errorText}`;
      }
    } catch (e) {
      // 忽略解析错误
    }
    if (response.status === 401) {
      errorMessage = '未授权，请重新登录';
    } else if (response.status === 500) {
      errorMessage = '服务器错误，请稍后重试';
    }
    throw new Error(errorMessage);
  }
  return await response.json();
};

/**
 * 按日期范围获取日记条目
 * @param {string} startDate - 开始日期，格式：YYYY-MM-DD
 * @param {string} endDate - 结束日期，格式：YYYY-MM-DD
 * @returns {Promise<JournalEntry[]>}
 */
export const getJournalEntriesByDateRange = async (startDate, endDate) => {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/journal-entries/by-date-range?startDate=${startDate}&endDate=${endDate}`
  );
  if (!response.ok) {
    throw new Error('获取日记失败');
  }
  return await response.json();
};

/**
 * 更新日记条目
 * @param {number} id - 日记ID
 * @param {Object} journalData - 更新的日记数据
 * @returns {Promise<JournalEntry>}
 */
export const updateJournalEntry = async (id, journalData) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/journal-entries/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(journalData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`更新日记失败: ${errorText}`);
  }

  return await response.json();
};

/**
 * 删除日记条目
 * @param {number} id - 日记ID
 * @returns {Promise<void>}
 */
export const deleteJournalEntry = async (id) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/journal-entries/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`删除日记失败: ${errorText}`);
  }
};

// ========== 以下方法保留用于向后兼容和统计功能 ==========

/**
 * 获取或创建今天的 JournalEntry
 * @returns {Promise<JournalEntry>}
 */
export const getOrCreateToday = async () => {
  const response = await authenticatedFetch(`${API_BASE_URL}/journal-entries/today`);
  if (!response.ok) {
    throw new Error('获取今日记录失败');
  }
  return await response.json();
};

/**
 * 获取某天的专注总时长（分钟）
 * @param {string} date - 日期字符串，格式：YYYY-MM-DD
 * @returns {Promise<number>}
 */
export const getFocusTime = async (date) => {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/journal-entries/focus-time?date=${date}`
  );
  if (!response.ok) {
    throw new Error('获取专注时间失败');
  }
  return await response.json();
};

/**
 * 累加专注时间
 * @param {string} date - 日期字符串，格式：YYYY-MM-DD
 * @param {number} focusMinutes - 专注分钟数
 * @returns {Promise<JournalEntry>}
 */
export const addFocusMinutes = async (date, focusMinutes) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/journal-entries/focus-time`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      date,
      focusMinutes,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`累加专注时间失败: ${errorText}`);
  }

  return await response.json();
};

