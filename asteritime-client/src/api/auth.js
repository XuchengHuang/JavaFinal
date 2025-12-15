import { API_BASE_URL } from '../config/api';

/**
 * 从 localStorage 获取 token
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * 保存 token 到 localStorage
 */
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

/**
 * 移除 token
 */
export const removeToken = () => {
  localStorage.removeItem('token');
};

/**
 * 保存用户信息到 localStorage
 */
export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

/**
 * 从 localStorage 获取用户信息
 */
export const getUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
};

/**
 * 移除用户信息
 */
export const removeUser = () => {
  localStorage.removeItem('user');
};

/**
 * 检查是否已登录
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * 登录接口
 * @param {string} email - 用户邮箱
 * @param {string} password - 密码
 * @returns {Promise<{token: string, user: object}>}
 */
export const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('邮箱或密码错误');
    }
    throw new Error('登录失败，请稍后重试');
  }

  const data = await response.json();
  
  // 保存 token 到 localStorage
  if (data.token) {
    setToken(data.token);
  }
  
  // 保存用户信息到 localStorage
  if (data.user) {
    setUser(data.user);
  }
  
  return data;
};

/**
 * 注册接口
 * @param {string} username - 用户名
 * @param {string} email - 用户邮箱
 * @param {string} password - 密码
 * @returns {Promise<User>}
 */
export const register = async (username, email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      email,
      password,
    }),
  });

  if (!response.ok) {
    if (response.status === 400) {
      throw new Error('邮箱已被注册');
    }
    throw new Error('注册失败，请稍后重试');
  }

  return await response.json();
};

/**
 * 登出接口
 * @returns {Promise<void>}
 */
export const logout = async () => {
  const token = getToken();
  if (!token) {
    return;
  }

  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('登出请求失败:', error);
  } finally {
    // 无论请求成功与否，都删除本地 token 和用户信息
    removeToken();
    removeUser();
  }
};

/**
 * 创建带认证头的 fetch 请求
 * @param {string} url - 请求 URL
 * @param {object} options - fetch 选项
 * @returns {Promise<Response>}
 */
export const authenticatedFetch = async (url, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

