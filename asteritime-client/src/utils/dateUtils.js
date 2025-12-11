/**
 * 日期工具函数
 * 自动使用浏览器的本地时区
 * 无论用户在哪个时区（纽约、上海等），都会自动使用正确的本地时间
 */

/**
 * 获取当前日期的本地日期字符串（格式：YYYY-MM-DD）
 * 使用本地时区，而不是UTC
 */
export const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 将日期字符串转换为本地日期对象
 * @param {string} dateString - 日期字符串，格式：YYYY-MM-DD
 * @returns {Date} 本地日期对象
 */
export const parseLocalDate = (dateString) => {
  if (!dateString) return new Date();
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * 获取今天的本地日期字符串
 */
export const getTodayLocalDateString = () => {
  return getLocalDateString(new Date());
};

/**
 * 获取昨天的本地日期字符串
 */
export const getYesterdayLocalDateString = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getLocalDateString(yesterday);
};

/**
 * 获取明天的本地日期字符串
 */
export const getTomorrowLocalDateString = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getLocalDateString(tomorrow);
};

/**
 * 比较两个日期字符串是否相同（使用本地时区）
 */
export const isSameLocalDate = (dateString1, dateString2) => {
  return dateString1 === dateString2;
};

/**
 * 格式化日期显示（根据浏览器语言自动选择格式）
 * 自动使用浏览器的时区和语言设置
 */
export const formatLocalDateDisplay = (dateString) => {
  const date = parseLocalDate(dateString);
  const today = getTodayLocalDateString();
  const yesterday = getYesterdayLocalDateString();
  const tomorrow = getTomorrowLocalDateString();

  // 获取浏览器语言
  const browserLang = navigator.language || navigator.userLanguage || 'en-US';
  const isChinese = browserLang.startsWith('zh');

  if (dateString === today) {
    return isChinese ? '今天' : 'Today';
  } else if (dateString === yesterday) {
    return isChinese ? '昨天' : 'Yesterday';
  } else if (dateString === tomorrow) {
    return isChinese ? '明天' : 'Tomorrow';
  } else {
    return date.toLocaleDateString(browserLang, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  }
};

/**
 * 格式化日期时间为本地字符串（格式：YYYY-MM-DD HH:mm:ss）
 * 自动使用浏览器的时区
 */
export const formatLocalDateTime = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  // 使用浏览器的本地时区
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * 格式化日期时间为ISO格式字符串（格式：YYYY-MM-DDTHH:mm:ss，不带时区）
 * 用于API请求，自动使用浏览器的时区
 */
export const formatLocalDateTimeISO = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  // 使用浏览器的本地时区
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

/**
 * 获取当前时区信息（用于调试）
 */
export const getCurrentTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * 获取时区偏移量（小时）
 */
export const getTimezoneOffset = () => {
  return -new Date().getTimezoneOffset() / 60;
};

/**
 * 格式化时间为本地时间字符串（格式：HH:mm）
 */
export const formatLocalTime = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};
