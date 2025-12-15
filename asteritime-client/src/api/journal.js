import { authenticatedFetch } from './auth';

import { API_BASE_URL } from '../config/api';

/**
 * Create a new journal entry
 * @param {Object} journalData - Journal data
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
    throw new Error(`Failed to create journal: ${errorText}`);
  }

  return await response.json();
};

/**
 * Get journal entry by ID
 * @param {number} id - Journal ID
 * @returns {Promise<JournalEntry>}
 */
export const getJournalEntryById = async (id) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/journal-entries/${id}`);
  if (!response.ok) {
    throw new Error('Failed to get journal entry');
  }
  return await response.json();
};

/**
 * Get all journal entries for current user (ordered by date desc)
 * @returns {Promise<JournalEntry[]>}
 */
export const getAllJournalEntries = async () => {
  const response = await authenticatedFetch(`${API_BASE_URL}/journal-entries`);
  if (!response.ok) {
    let errorMessage = 'Failed to get journal list';
    try {
      const errorText = await response.text();
      if (errorText) {
        errorMessage += `: ${errorText}`;
      }
    } catch (e) {
      // Ignore parse errors
    }
    if (response.status === 401) {
      errorMessage = 'Unauthorized, please login again';
    } else if (response.status === 500) {
      errorMessage = 'Server error, please try again later';
    }
    throw new Error(errorMessage);
  }
  return await response.json();
};

/**
 * Get journal entries by date (returns all entries for that day)
 * @param {string} date - Date string, format: YYYY-MM-DD
 * @returns {Promise<JournalEntry[]>}
 */
export const getJournalEntriesByDate = async (date) => {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/journal-entries/by-date?date=${date}`
  );
  if (!response.ok) {
    let errorMessage = 'Failed to get journal entries';
    try {
      const errorText = await response.text();
      if (errorText) {
        errorMessage += `: ${errorText}`;
      }
    } catch (e) {
      // Ignore parse errors
    }
    if (response.status === 401) {
      errorMessage = 'Unauthorized, please login again';
    } else if (response.status === 500) {
      errorMessage = 'Server error, please try again later';
    }
    throw new Error(errorMessage);
  }
  return await response.json();
};

/**
 * Get journal entries by date range
 * @param {string} startDate - Start date, format: YYYY-MM-DD
 * @param {string} endDate - End date, format: YYYY-MM-DD
 * @returns {Promise<JournalEntry[]>}
 */
export const getJournalEntriesByDateRange = async (startDate, endDate) => {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/journal-entries/by-date-range?startDate=${startDate}&endDate=${endDate}`
  );
  if (!response.ok) {
    throw new Error('Failed to get journal entries');
  }
  return await response.json();
};

/**
 * Update journal entry
 * @param {number} id - Journal ID
 * @param {Object} journalData - Updated journal data
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
    throw new Error(`Failed to update journal: ${errorText}`);
  }

  return await response.json();
};

/**
 * Delete journal entry
 * @param {number} id - Journal ID
 * @returns {Promise<void>}
 */
export const deleteJournalEntry = async (id) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/journal-entries/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete journal: ${errorText}`);
  }
};

/**
 * Get or create today's journal entry
 * @returns {Promise<JournalEntry>}
 */
export const getOrCreateToday = async () => {
  const response = await authenticatedFetch(`${API_BASE_URL}/journal-entries/today`);
  if (!response.ok) {
    throw new Error('Failed to get today\'s entry');
  }
  return await response.json();
};

/**
 * Get total focus minutes for a specific date
 * @param {string} date - Date string, format: YYYY-MM-DD
 * @returns {Promise<number>}
 */
export const getFocusTime = async (date) => {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/journal-entries/focus-time?date=${date}`
  );
  if (!response.ok) {
    throw new Error('Failed to get focus time');
  }
  return await response.json();
};

/**
 * Add focus minutes
 * @param {string} date - Date string, format: YYYY-MM-DD
 * @param {number} focusMinutes - Focus minutes
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
    throw new Error(`Failed to add focus time: ${errorText}`);
  }

  return await response.json();
};

