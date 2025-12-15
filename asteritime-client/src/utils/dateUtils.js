/**
 * Date utility functions
 * Automatically use browser's local timezone
 * Regardless of which timezone the user is in (New York, Shanghai, etc.), automatically use correct local time
 */

/**
 * Get local date string for current date (format: YYYY-MM-DD)
 * Use local timezone, not UTC
 */
export const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Convert date string to local date object
 * @param {string} dateString - Date string, format: YYYY-MM-DD
 * @returns {Date} Local date object
 */
export const parseLocalDate = (dateString) => {
  if (!dateString) return new Date();
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Get today's local date string
 */
export const getTodayLocalDateString = () => {
  return getLocalDateString(new Date());
};

/**
 * Get yesterday's local date string
 */
export const getYesterdayLocalDateString = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getLocalDateString(yesterday);
};

/**
 * Get tomorrow's local date string
 */
export const getTomorrowLocalDateString = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getLocalDateString(tomorrow);
};

/**
 * Compare if two date strings are the same (using local timezone)
 */
export const isSameLocalDate = (dateString1, dateString2) => {
  return dateString1 === dateString2;
};

/**
 * Format date display (always use English format)
 * Automatically use browser's timezone but always display in English
 */
export const formatLocalDateDisplay = (dateString) => {
  const date = parseLocalDate(dateString);
  const today = getTodayLocalDateString();
  const yesterday = getYesterdayLocalDateString();
  const tomorrow = getTomorrowLocalDateString();

  if (dateString === today) {
    return 'Today';
  } else if (dateString === yesterday) {
    return 'Yesterday';
  } else if (dateString === tomorrow) {
    return 'Tomorrow';
  } else {
    // Always use English locale to ensure English format
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  }
};

/**
 * Format date time as local string (format: YYYY-MM-DD HH:mm:ss)
 * Automatically use browser's timezone
 */
export const formatLocalDateTime = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  // Use browser's local timezone
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Format date time as ISO format string (format: YYYY-MM-DDTHH:mm:ss, without timezone)
 * For API requests, automatically use browser's timezone
 */
export const formatLocalDateTimeISO = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  // Use browser's local timezone
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

/**
 * Get current timezone information (for debugging)
 */
export const getCurrentTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Get timezone offset (hours)
 */
export const getTimezoneOffset = () => {
  return -new Date().getTimezoneOffset() / 60;
};

/**
 * Format time as local time string (format: HH:mm)
 */
export const formatLocalTime = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};
