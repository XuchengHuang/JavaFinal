import { API_BASE_URL } from '../config/api';

/**
 * Get token from localStorage
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Save token to localStorage
 */
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

/**
 * Remove token from localStorage
 */
export const removeToken = () => {
  localStorage.removeItem('token');
};

/**
 * Save user info to localStorage
 */
export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

/**
 * Get user info from localStorage
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
 * Remove user info from localStorage
 */
export const removeUser = () => {
  localStorage.removeItem('user');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Login API
 * @param {string} email - User email
 * @param {string} password - Password
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
      throw new Error('Invalid email or password');
    }
    throw new Error('Login failed, please try again');
  }

  const data = await response.json();
  
  if (data.token) {
    setToken(data.token);
  }
  
  if (data.user) {
    setUser(data.user);
  }
  
  return data;
};

/**
 * Register API
 * @param {string} username - Username
 * @param {string} email - User email
 * @param {string} password - Password
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
      throw new Error('Email already registered');
    }
    throw new Error('Registration failed, please try again');
  }

  return await response.json();
};

/**
 * Logout API
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
    console.error('Logout request failed:', error);
  } finally {
    removeToken();
    removeUser();
  }
};

/**
 * Create authenticated fetch request
 * @param {string} url - Request URL
 * @param {object} options - Fetch options
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

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    // Handle 401 Unauthorized - token missing, invalid, or expired
    if (response.status === 401) {
      // Clear invalid token
      removeToken();
      removeUser();
      
      // Dispatch logout event to notify components
      window.dispatchEvent(new Event('logout'));
      
      // Redirect to login page if we're in a browser environment
      if (typeof window !== 'undefined' && window.location) {
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      // Throw error with helpful message
      const errorData = await response.json().catch(() => ({ error: 'Unauthorized' }));
      const error = new Error(errorData.error || 'Authentication required. Please login again.');
      error.status = 401;
      error.isAuthError = true;
      throw error;
    }
    
    return response;
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new Error('Network error: Cannot connect to server. Please check if the backend is running.');
      networkError.isNetworkError = true;
      throw networkError;
    }
    throw error;
  }
};

