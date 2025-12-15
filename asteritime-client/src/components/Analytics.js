import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getTasks } from '../api/task';
import { getJournalEntriesByDate, getJournalEntriesByDateRange } from '../api/journal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { getTodayLocalDateString } from '../utils/dateUtils';
import './Analytics.css';

// Pie chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

// Quadrant color mapping
const QUADRANT_COLORS = {
  1: '#FF6B9D', // Important & Urgent - Pink
  2: '#A8E6CF', // Important & Not Urgent - Light Green
  3: '#FFD93D', // Urgent & Not Important - Yellow
  4: '#95E1D3', // Not Important & Not Urgent - Light Blue
};

// Quadrant name mapping
const QUADRANT_NAMES = {
  1: 'Important & Urgent',
  2: 'Important & Not Urgent',
  3: 'Urgent & Not Important',
  4: 'Not Important & Not Urgent',
};

function Analytics() {
  const [tasks, setTasks] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDelayCancel, setSelectedDelayCancel] = useState(null);
  const [selectedStatusComparison, setSelectedStatusComparison] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'plan', 'focus', 'recurring'
  
  const [selectedDate, setSelectedDate] = useState(getTodayLocalDateString());
  const [weeklySelectedDate, setWeeklySelectedDate] = useState(getTodayLocalDateString()); // Weekly report: select any day, automatically locate to the week
  const [focusSelectedDate, setFocusSelectedDate] = useState(getTodayLocalDateString()); // Focus tab date selection
  const [overviewSelectedDate, setOverviewSelectedDate] = useState(getTodayLocalDateString()); // Overview tab date selection
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'weekly'

  // Format local time as YYYY-MM-DDTHH:mm:ss format (without timezone)
  const formatLocalDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  // Get today's date range (using local time)
  const getTodayRange = () => {
    const today = new Date(selectedDate);
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    return {
      startTime: formatLocalDateTime(start),
      endTime: formatLocalDateTime(end),
    };
  };


  // Load tasks and journal data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Overview tab: load tasks for specified date
        if (activeTab === 'overview') {
          // Load tasks based on selected date
          const dateParts = overviewSelectedDate.split('-');
          const year = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10) - 1;
          const day = parseInt(dateParts[2], 10);
          
          const start = new Date(year, month, day, 0, 0, 0);
          const end = new Date(year, month, day, 23, 59, 59);
          
          const range = {
            startTime: formatLocalDateTime(start),
            endTime: formatLocalDateTime(end),
          };
          
          const allTasks = await getTasks({
            startTime: range.startTime,
            endTime: range.endTime,
          });
          setTasks(allTasks || []);
        } 
        // Plan tab: load tasks for specified range based on viewMode
        else if (activeTab === 'plan') {
          let range;
          if (viewMode === 'daily') {
            // Parse selected date string (YYYY-MM-DD format)
            const dateParts = selectedDate.split('-');
            const year = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1; // Month starts from 0
            const day = parseInt(dateParts[2], 10);
            
            const start = new Date(year, month, day, 0, 0, 0);
            const end = new Date(year, month, day, 23, 59, 59);
            
            range = {
              startTime: formatLocalDateTime(start),
              endTime: formatLocalDateTime(end),
            };
          } else {
            // Determine the week based on selected date (Monday to Sunday)
            const baseDate = new Date(weeklySelectedDate);
            const day = baseDate.getDay();
            const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(baseDate.setDate(diff));
            monday.setHours(0, 0, 0, 0);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            sunday.setHours(23, 59, 59, 999);
            range = {
              startTime: formatLocalDateTime(monday),
              endTime: formatLocalDateTime(sunday),
            };
          }
          
          // Load tasks
          const allTasks = await getTasks({
            startTime: range.startTime,
            endTime: range.endTime,
          });
          setTasks(allTasks || []);
        }
        // Focus tab: load journal data for specified date
        else if (activeTab === 'focus') {
          // Load journal data for selected date
          const entries = await getJournalEntriesByDate(focusSelectedDate);
          setJournalEntries(entries || []);
        }
        
        // Load journal data (for focus statistics, also needed if not in focus tab)
        if (activeTab !== 'focus' && viewMode === 'daily') {
          const entries = await getJournalEntriesByDate(selectedDate);
          setJournalEntries(entries || []);
        } else if (activeTab !== 'focus' && viewMode === 'weekly') {
          // Weekly report: calculate start and end dates based on selected date's week
          const baseDate = new Date(weeklySelectedDate);
          const day = baseDate.getDay();
          const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(baseDate.setDate(diff));
          monday.setHours(0, 0, 0, 0);
          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);
          sunday.setHours(23, 59, 59, 999);
          
          const startDateStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
          const endDateStr = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;
          const entries = await getJournalEntriesByDateRange(startDateStr, endDateStr);
          setJournalEntries(entries || []);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab, viewMode, selectedDate, weeklySelectedDate, focusSelectedDate, overviewSelectedDate]);

  // Parse time string to local time
  const parseLocalDateTime = (dateString) => {
    if (!dateString) return null;
    // If time string does not contain timezone information, treat it as local time
    if (dateString.includes('T')) {
      if (dateString.endsWith('Z') || dateString.includes('+') || dateString.includes('-', 10)) {
        // Has timezone information, use standard parsing
        return new Date(dateString);
      } else {
        // No timezone information, treat as local time
        const [datePart, timePart] = dateString.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes, seconds] = (timePart || '00:00:00').split(':').map(Number);
        return new Date(year, month - 1, day, hours, minutes, seconds || 0);
      }
    }
    return new Date(dateString);
  };

  // Calculate task duration (minutes)
  const calculateTaskDuration = useCallback((task) => {
    if (!task.plannedStartTime || !task.plannedEndTime) return 0;
    const start = parseLocalDateTime(task.plannedStartTime);
    const end = parseLocalDateTime(task.plannedEndTime);
    if (!start || !end) return 0;
    const duration = Math.max((end - start) / (1000 * 60), 0);
    // Ensure return valid number
    return isNaN(duration) ? 0 : duration;
  }, []);

  // Format duration display
  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${Math.round(minutes)}min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  // Statistics by category (Daily Report) - Count all tasks with planned time (including planned and completed)
  const dailyCategoryStats = useMemo(() => {
    const categoryMap = new Map();
    
    tasks.forEach(task => {
      // Count all tasks with planned time (TODO, DOING, DONE status)
      if (!task.plannedStartTime || !task.plannedEndTime) return;
      if (task.status === 'CANCEL' || task.status === 'DELAY') return; // Exclude cancelled and delayed tasks
      
      // Strictly handle category: if type is null/undefined or name is empty, treat as "Uncategorized"
      const categoryName = (task.type && task.type.name) ? task.type.name : 'Uncategorized';
      const duration = calculateTaskDuration(task);
      
      // Ensure duration is a valid number
      if (isNaN(duration) || duration <= 0) return;
      
      if (categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, categoryMap.get(categoryName) + duration);
      } else {
        categoryMap.set(categoryName, duration);
      }
    });

    const stats = Array.from(categoryMap.entries()).map(([name, duration]) => ({
      name,
      duration: Math.round(duration),
      hours: (duration / 60).toFixed(1),
    }));

    // Calculate total duration
    const totalDuration = stats.reduce((sum, item) => sum + item.duration, 0);
    
    // Calculate percentage
    return stats.map(item => ({
      ...item,
      percentage: totalDuration > 0 ? ((item.duration / totalDuration) * 100).toFixed(1) : 0,
    })).sort((a, b) => b.duration - a.duration);
  }, [tasks, calculateTaskDuration]);

  // Statistics for delayed and cancelled task duration (Daily Report)
  const dailyDelayCancelStats = useMemo(() => {
    const delayTasks = [];
    const cancelTasks = [];
    
    tasks.forEach(task => {
      if (!task.plannedStartTime || !task.plannedEndTime) return;
      
      const duration = calculateTaskDuration(task);
      
      if (task.status === 'DELAY') {
        delayTasks.push({
          ...task,
          duration: Math.round(duration),
        });
      } else if (task.status === 'CANCEL') {
        cancelTasks.push({
          ...task,
          duration: Math.round(duration),
        });
      }
    });

    const delayTotal = delayTasks.reduce((sum, task) => sum + task.duration, 0);
    const cancelTotal = cancelTasks.reduce((sum, task) => sum + task.duration, 0);
    const totalDuration = delayTotal + cancelTotal;

    const stats = [];
    if (delayTotal > 0) {
      stats.push({
        name: 'Delayed',
        duration: delayTotal,
        hours: (delayTotal / 60).toFixed(1),
        percentage: totalDuration > 0 ? ((delayTotal / totalDuration) * 100).toFixed(1) : 0,
        status: 'DELAY',
        tasks: delayTasks,
      });
    }
    if (cancelTotal > 0) {
      stats.push({
        name: 'Cancelled',
        duration: cancelTotal,
        hours: (cancelTotal / 60).toFixed(1),
        percentage: totalDuration > 0 ? ((cancelTotal / totalDuration) * 100).toFixed(1) : 0,
        status: 'CANCEL',
        tasks: cancelTasks,
      });
    }

    return stats.sort((a, b) => b.duration - a.duration);
  }, [tasks, calculateTaskDuration]);

  // Compare completed, delayed, and cancelled task duration (Daily Report)
  const dailyStatusComparisonStats = useMemo(() => {
    const doneTasks = [];
    const delayTasks = [];
    const cancelTasks = [];
    
    tasks.forEach(task => {
      if (!task.plannedStartTime || !task.plannedEndTime) return;
      
      const duration = calculateTaskDuration(task);
      
      if (task.status === 'DONE') {
        doneTasks.push({
          ...task,
          duration: Math.round(duration),
        });
      } else if (task.status === 'DELAY') {
        delayTasks.push({
          ...task,
          duration: Math.round(duration),
        });
      } else if (task.status === 'CANCEL') {
        cancelTasks.push({
          ...task,
          duration: Math.round(duration),
        });
      }
    });

    const doneTotal = doneTasks.reduce((sum, task) => sum + task.duration, 0);
    const delayTotal = delayTasks.reduce((sum, task) => sum + task.duration, 0);
    const cancelTotal = cancelTasks.reduce((sum, task) => sum + task.duration, 0);
    const totalDuration = doneTotal + delayTotal + cancelTotal;

    const stats = [];
    if (doneTotal > 0) {
      stats.push({
        name: 'Completed',
        duration: doneTotal,
        hours: (doneTotal / 60).toFixed(1),
        percentage: totalDuration > 0 ? ((doneTotal / totalDuration) * 100).toFixed(1) : 0,
        status: 'DONE',
        tasks: doneTasks,
      });
    }
    if (delayTotal > 0) {
      stats.push({
        name: 'Delayed',
        duration: delayTotal,
        hours: (delayTotal / 60).toFixed(1),
        percentage: totalDuration > 0 ? ((delayTotal / totalDuration) * 100).toFixed(1) : 0,
        status: 'DELAY',
        tasks: delayTasks,
      });
    }
    if (cancelTotal > 0) {
      stats.push({
        name: 'Cancelled',
        duration: cancelTotal,
        hours: (cancelTotal / 60).toFixed(1),
        percentage: totalDuration > 0 ? ((cancelTotal / totalDuration) * 100).toFixed(1) : 0,
        status: 'CANCEL',
        tasks: cancelTasks,
      });
    }

    return stats.sort((a, b) => {
      // Sort by status: Completed > Delayed > Cancelled
      const order = { 'DONE': 1, 'DELAY': 2, 'CANCEL': 3 };
      return order[a.status] - order[b.status];
    });
  }, [tasks, calculateTaskDuration]);

  // Statistics by category (Weekly Report) - Count all tasks with planned time (including planned and completed)
  const weeklyCategoryStats = useMemo(() => {
    const categoryMap = new Map();
    
    tasks.forEach(task => {
      // Count all tasks with planned time (TODO, DOING, DONE status)
      if (!task.plannedStartTime || !task.plannedEndTime) return;
      if (task.status === 'CANCEL' || task.status === 'DELAY') return; // Exclude cancelled and delayed tasks
      
      // Strictly handle category: if type is null/undefined or name is empty, treat as "Uncategorized"
      const categoryName = (task.type && task.type.name) ? task.type.name : 'Uncategorized';
      const duration = calculateTaskDuration(task);
      
      if (categoryMap.has(categoryName)) {
        const existing = categoryMap.get(categoryName);
        existing.totalDuration += duration;
        existing.tasks.push({
          ...task,
          duration: Math.round(duration),
        });
      } else {
        categoryMap.set(categoryName, {
          name: categoryName,
          totalDuration: duration,
          tasks: [{
            ...task,
            duration: Math.round(duration),
          }],
        });
      }
    });

    const stats = Array.from(categoryMap.values()).map(item => ({
      ...item,
      totalDuration: Math.round(item.totalDuration),
      duration: Math.round(item.totalDuration), // Compatible with detail modal field name
      hours: (item.totalDuration / 60).toFixed(1),
    }));

    // Calculate total duration
    const totalDuration = stats.reduce((sum, item) => sum + item.totalDuration, 0);
    
    // Calculate percentage
    return stats.map(item => ({
      ...item,
      percentage: totalDuration > 0 ? ((item.totalDuration / totalDuration) * 100).toFixed(1) : 0,
    })).sort((a, b) => b.totalDuration - a.totalDuration);
  }, [tasks, calculateTaskDuration]);

  // Statistics of completed tasks by quadrant (Overview tab)
  const completedTasksByQuadrant = useMemo(() => {
    const quadrantMap = new Map();
    
    tasks.forEach(task => {
      // Only count completed tasks
      if (task.status !== 'DONE') return;
      
      // If date is selected, only count tasks for that date
      if (activeTab === 'overview' && overviewSelectedDate) {
        // Check task date (prefer plannedStartTime, if not available use createdAt)
        let taskDateStr = null;
        if (task.plannedStartTime) {
          const taskDate = parseLocalDateTime(task.plannedStartTime);
          if (taskDate) {
            const year = taskDate.getFullYear();
            const month = String(taskDate.getMonth() + 1).padStart(2, '0');
            const day = String(taskDate.getDate()).padStart(2, '0');
            taskDateStr = `${year}-${month}-${day}`;
          }
        } else if (task.createdAt) {
          const taskDate = parseLocalDateTime(task.createdAt);
          if (taskDate) {
            const year = taskDate.getFullYear();
            const month = String(taskDate.getMonth() + 1).padStart(2, '0');
            const day = String(taskDate.getDate()).padStart(2, '0');
            taskDateStr = `${year}-${month}-${day}`;
          }
        }
        
        // If task date doesn't match selected date, skip
        if (taskDateStr !== overviewSelectedDate) return;
      }
      
      const quadrant = task.quadrant || 1;
      
      if (quadrantMap.has(quadrant)) {
        quadrantMap.set(quadrant, quadrantMap.get(quadrant) + 1);
      } else {
        quadrantMap.set(quadrant, 1);
      }
    });
    
    const stats = Array.from(quadrantMap.entries()).map(([quadrant, count]) => ({
      quadrant: parseInt(quadrant),
      name: QUADRANT_NAMES[quadrant] || `Quadrant ${quadrant}`,
      count: count,
      color: QUADRANT_COLORS[quadrant] || COLORS[quadrant - 1],
    }));
    
    const total = stats.reduce((sum, item) => sum + item.count, 0);
    
    return stats.map(item => ({
      ...item,
      percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : 0,
    })).sort((a, b) => a.quadrant - b.quadrant);
  }, [tasks, activeTab, overviewSelectedDate]);

  // Statistics of completed tasks by category (Overview tab)
  const completedTasksByCategory = useMemo(() => {
    const categoryMap = new Map();
    
    tasks.forEach(task => {
      // Only count completed tasks
      if (task.status !== 'DONE') return;
      
      // If date is selected, only count tasks for that date
      if (activeTab === 'overview' && overviewSelectedDate) {
        // Check task date (prefer plannedStartTime, if not available use createdAt)
        let taskDateStr = null;
        if (task.plannedStartTime) {
          const taskDate = parseLocalDateTime(task.plannedStartTime);
          if (taskDate) {
            const year = taskDate.getFullYear();
            const month = String(taskDate.getMonth() + 1).padStart(2, '0');
            const day = String(taskDate.getDate()).padStart(2, '0');
            taskDateStr = `${year}-${month}-${day}`;
          }
        } else if (task.createdAt) {
          const taskDate = parseLocalDateTime(task.createdAt);
          if (taskDate) {
            const year = taskDate.getFullYear();
            const month = String(taskDate.getMonth() + 1).padStart(2, '0');
            const day = String(taskDate.getDate()).padStart(2, '0');
            taskDateStr = `${year}-${month}-${day}`;
          }
        }
        
        // If task date doesn't match selected date, skip
        if (taskDateStr !== overviewSelectedDate) return;
      }
      
      const categoryName = (task.type && task.type.name) ? task.type.name : 'Uncategorized';
      
      if (categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, categoryMap.get(categoryName) + 1);
      } else {
        categoryMap.set(categoryName, 1);
      }
    });
    
    const stats = Array.from(categoryMap.entries()).map(([name, count]) => ({
      name,
      count,
    }));
    
    return stats.sort((a, b) => b.count - a.count);
  }, [tasks, activeTab, overviewSelectedDate]);

  // Focus statistics (Focus tab)
  const focusStats = useMemo(() => {
    // Calculate total focus duration and count
    let totalFocusMinutes = 0;
    let focusCount = 0;
    
    journalEntries.forEach(entry => {
      if (entry.totalFocusMinutes && entry.totalFocusMinutes > 0) {
        totalFocusMinutes += entry.totalFocusMinutes;
        focusCount++;
      }
    });
    
    // Statistics by activity type for focus duration (if activity field exists)
    const activityMap = new Map();
    journalEntries.forEach(entry => {
      if (entry.totalFocusMinutes && entry.totalFocusMinutes > 0 && entry.activity) {
        const activity = entry.activity;
        if (activityMap.has(activity)) {
          activityMap.set(activity, activityMap.get(activity) + entry.totalFocusMinutes);
        } else {
          activityMap.set(activity, entry.totalFocusMinutes);
        }
      }
    });
    
    const activityStats = Array.from(activityMap.entries()).map(([name, minutes]) => ({
      name,
      minutes: Math.round(minutes),
      hours: (minutes / 60).toFixed(1),
    }));
    
    const totalActivityMinutes = activityStats.reduce((sum, item) => sum + item.minutes, 0);
    
    return {
      totalFocusMinutes: Math.round(totalFocusMinutes),
      focusCount,
      activityStats: activityStats.map(item => ({
        ...item,
        percentage: totalActivityMinutes > 0 ? ((item.minutes / totalActivityMinutes) * 100).toFixed(1) : 0,
      })).sort((a, b) => b.minutes - a.minutes),
    };
  }, [journalEntries]);

  // Focus time distribution (hourly statistics for selected date)
  const focusTimeDistribution = useMemo(() => {
    const hourMap = new Map();
    
    // Only count data for selected date
    journalEntries.forEach(entry => {
      if (entry.totalFocusMinutes && entry.totalFocusMinutes > 0) {
        // Get journal entry date
        let entryDateStr;
        if (entry.date) {
          entryDateStr = entry.date; // Format: YYYY-MM-DD
        } else if (entry.createdAt) {
          const date = new Date(entry.createdAt);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          entryDateStr = `${year}-${month}-${day}`;
        }
        
        // Only count data for selected date
        if (entryDateStr === focusSelectedDate) {
          // Get hour from createdAt
          if (entry.createdAt) {
            const date = new Date(entry.createdAt);
            const hour = date.getHours();
            const minutes = entry.totalFocusMinutes || 0;
            
            if (hourMap.has(hour)) {
              hourMap.set(hour, hourMap.get(hour) + minutes);
            } else {
              hourMap.set(hour, minutes);
            }
          }
        }
      }
    });
    
    // Generate 24-hour data
    const stats = [];
    for (let i = 0; i < 24; i++) {
      stats.push({
        hour: i,
        label: `${i}:00`,
        minutes: Math.round(hourMap.get(i) || 0),
      });
    }
    
    return stats;
  }, [journalEntries, focusSelectedDate]);

  // Pie chart click event
  const handlePieClick = (data) => {
    if (data && data.name) {
      setSelectedCategory(data.name);
    }
  };

  // Delayed/Cancelled pie chart click event
  const handleDelayCancelPieClick = (data) => {
    if (data && data.name) {
      setSelectedDelayCancel(data);
    }
  };

  // Status comparison pie chart click event
  const handleStatusComparisonPieClick = (data) => {
    if (data && data.name) {
      setSelectedStatusComparison(data);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'DONE': '#28a745',    // Green
      'DELAY': '#ffc107',    // Yellow
      'CANCEL': '#dc3545',   // Red
    };
    return colors[status] || '#6c757d';
  };

  // Weekly category click event
  const handleWeeklyCategoryClick = (category) => {
    setSelectedCategory(category.name);
  };

  // Get task list for selected category (returns all tasks with planned time, excluding cancelled and delayed)
  const getCategoryTasks = (categoryName) => {
    return tasks
      .filter(task => {
        // Strictly handle category: if type is null/undefined or name is empty, treat as "Uncategorized"
        const taskCategoryName = (task.type && task.type.name) ? task.type.name : 'Uncategorized';
        return (task.status === 'TODO' || task.status === 'DOING' || task.status === 'DONE') && 
               taskCategoryName === categoryName && 
               task.plannedStartTime && 
               task.plannedEndTime;
      })
      .map(task => ({
        ...task,
        duration: Math.round(calculateTaskDuration(task)),
      }))
      .sort((a, b) => b.duration - a.duration);
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="analytics-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="page-content analytics-container">
      {/* Tab switching */}
      <div className="analytics-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'plan' ? 'active' : ''}`}
          onClick={() => setActiveTab('plan')}
        >
          Plan
        </button>
        <button
          className={`tab-btn ${activeTab === 'focus' ? 'active' : ''}`}
          onClick={() => setActiveTab('focus')}
        >
          Focus
        </button>
      </div>

      {/* View switching (only shown in Plan tab) */}
      {activeTab === 'plan' && (
        <div className="analytics-header">
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'daily' ? 'active' : ''}`}
              onClick={() => setViewMode('daily')}
            >
              Daily
            </button>
            <button
              className={`toggle-btn ${viewMode === 'weekly' ? 'active' : ''}`}
              onClick={() => setViewMode('weekly')}
            >
              Weekly
            </button>
          </div>
          {viewMode === 'daily' && (
            <input
              type="date"
              lang="en"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-picker"
            />
          )}
          {viewMode === 'weekly' && (
            <div className="date-selector-group">
              <label htmlFor="weekly-date-picker">Select Week:</label>
              <input
                id="weekly-date-picker"
                type="date"
              lang="en"
                value={weeklySelectedDate}
                onChange={(e) => setWeeklySelectedDate(e.target.value)}
                className="date-picker"
              />
            </div>
          )}
        </div>
      )}

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="overview-analytics">
          {/* Date selector */}
          <div className="analytics-header">
            <div className="date-selector-group">
              <label htmlFor="overview-date-picker">Select Date:</label>
              <input
                id="overview-date-picker"
                type="date"
              lang="en"
                value={overviewSelectedDate}
                onChange={(e) => setOverviewSelectedDate(e.target.value)}
                className="date-picker"
              />
            </div>
          </div>

          {/* Completed Plans - Pie chart by quadrant */}
          {completedTasksByQuadrant.length > 0 && (
            <div className="chart-section">
              <h3>Completed Plans</h3>
              <div className="chart-summary">
                <div className="summary-text">Completed Plans</div>
                <div className="summary-count">
                  {completedTasksByQuadrant.reduce((sum, item) => sum + item.count, 0)} tasks
                </div>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={completedTasksByQuadrant}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {completedTasksByQuadrant.map((entry, index) => (
                      <Cell key={`quadrant-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `${value} tasks`}
                    labelFormatter={(label) => label}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Keep only one set of legend */}
              <div className="quadrant-legend">
                {completedTasksByQuadrant.map((item) => (
                  <div key={item.quadrant} className="legend-item">
                    <span className="legend-dot" style={{ backgroundColor: item.color }}></span>
                    <span>{item.name}: {item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Plans by Category - Horizontal bar chart */}
          {completedTasksByCategory.length > 0 && (
            <div className="chart-section">
              <h3>Completed Plans by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={completedTasksByCategory}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip formatter={(value) => `${value} tasks`} />
                  <Bar dataKey="count" fill="#8884d8">
                    {completedTasksByCategory.map((entry, index) => (
                      <Cell key={`category-bar-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {completedTasksByQuadrant.length === 0 && completedTasksByCategory.length === 0 && (
            <div className="empty-state">No completed task data available</div>
          )}
        </div>
      )}

      {/* Plan tab (existing content) */}
      {activeTab === 'plan' && (

        <div className="plan-analytics">
          {viewMode === 'daily' ? (
            /* Daily view */
            <div className="daily-analytics">
          {dailyCategoryStats.length > 0 ? (
            <>
              <div className="chart-section">
                <h3>Category Duration Statistics - Bar Chart</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyCategoryStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatDuration(value)}
                      labelFormatter={(label) => `Category: ${label}`}
                    />
                    <Bar dataKey="duration" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-section">
                <h3>Category Duration Proportion - Pie Chart</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={dailyCategoryStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="duration"
                      onClick={handlePieClick}
                      cursor="pointer"
                    >
                      {dailyCategoryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatDuration(value)}
                      labelFormatter={(label) => `Category: ${label}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="empty-state">No task data available for this date</div>
          )}

          {/* Delayed/Cancelled statistics */}
          {dailyDelayCancelStats.length > 0 && (
            <>
              <div className="chart-section">
                <h3>Delayed/Cancelled Duration Statistics - Bar Chart</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyDelayCancelStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatDuration(value)}
                      labelFormatter={(label) => `Status: ${label}`}
                    />
                    <Bar dataKey="duration" fill="#8884d8">
                      {dailyDelayCancelStats.map((entry, index) => (
                        <Cell key={`bar-cell-${index}`} fill={entry.status === 'DELAY' ? '#ffc107' : '#dc3545'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-section">
                <h3>Delayed/Cancelled Duration Proportion - Pie Chart</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={dailyDelayCancelStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="duration"
                      onClick={handleDelayCancelPieClick}
                      cursor="pointer"
                    >
                      {dailyDelayCancelStats.map((entry, index) => (
                        <Cell 
                          key={`delay-cancel-cell-${index}`} 
                          fill={entry.status === 'DELAY' ? '#ffc107' : '#dc3545'} 
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatDuration(value)}
                      labelFormatter={(label) => `Status: ${label}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {/* Status comparison pie chart */}
          {dailyStatusComparisonStats.length > 0 && (
            <div className="chart-section">
              <h3>Task Status Duration Comparison - Pie Chart</h3>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={dailyStatusComparisonStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="duration"
                    onClick={handleStatusComparisonPieClick}
                    cursor="pointer"
                  >
                    {dailyStatusComparisonStats.map((entry, index) => (
                      <Cell 
                        key={`status-comparison-cell-${index}`} 
                        fill={getStatusColor(entry.status)} 
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatDuration(value)}
                    labelFormatter={(label) => `Status: ${label}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ) : (
        /* Weekly view */
        <div className="weekly-analytics">
          <h3>This Week's Category Statistics</h3>
          <div className="category-list">
            {weeklyCategoryStats.map((category, index) => (
              <div
                key={category.name}
                className="category-item"
                onClick={() => handleWeeklyCategoryClick(category)}
              >
                <div className="category-bar">
                  <div
                    className="category-bar-fill"
                    style={{
                      width: `${category.percentage}%`,
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  />
                </div>
                <div className="category-info">
                  <span className="category-name">{category.name}</span>
                  <span className="category-duration">{formatDuration(category.totalDuration)}</span>
                  <span className="category-percentage">{category.percentage}%</span>
                </div>
              </div>
            ))}
            {weeklyCategoryStats.length === 0 && (
              <div className="empty-state">No task data available for this week</div>
            )}
          </div>
        </div>
          )}
        </div>
      )}

      {/* Focus tab */}
      {activeTab === 'focus' && (
        <div className="focus-analytics">
          {/* Date selector */}
          <div className="analytics-header">
            <div className="date-selector-group">
              <label htmlFor="focus-date-picker">Select Date:</label>
              <input
                id="focus-date-picker"
                type="date"
              lang="en"
                value={focusSelectedDate}
                onChange={(e) => setFocusSelectedDate(e.target.value)}
                className="date-picker"
              />
            </div>
          </div>

          {/* Focus summary card */}
          <div className="focus-summary-card">
            <div className="summary-item">
              <div className="summary-label">Focus Duration</div>
              <div className="summary-value">{formatDuration(focusStats.totalFocusMinutes)}</div>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-item">
              <div className="summary-label">Focus Count</div>
              <div className="summary-value">{focusStats.focusCount} times</div>
            </div>
          </div>

          {/* Focus duration distribution - Donut chart */}
          {focusStats.activityStats.length > 0 && (
            <div className="chart-section">
              <h3>Focus Duration Distribution</h3>
              <div className="chart-summary">
                <div className="summary-text">Total Focus Duration</div>
                <div className="summary-count">{formatDuration(focusStats.totalFocusMinutes)}</div>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={focusStats.activityStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="minutes"
                  >
                    {focusStats.activityStats.map((entry, index) => (
                      <Cell key={`activity-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatDuration(value)}
                    labelFormatter={(label) => label}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Detail list */}
              <div className="activity-detail-list">
                {focusStats.activityStats.map((item, index) => (
                  <div key={item.name} className="activity-item">
                    <div className="activity-name">{item.name}</div>
                    <div className="activity-progress">
                      <div 
                        className="activity-progress-bar"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                    </div>
                    <div className="activity-info">
                      <span className="activity-duration">{formatDuration(item.minutes)}</span>
                      <span className="activity-percentage">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Focus time distribution (hourly display for selected date) */}
          {focusTimeDistribution.some(item => item.minutes > 0) && (
            <div className="chart-section">
              <h3>Focus Time Distribution ({focusSelectedDate})</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={focusTimeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="hour" 
                    label={{ value: 'Hour', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    formatter={(value) => formatDuration(value)}
                    labelFormatter={(label) => `${label}:00`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="minutes" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {focusStats.totalFocusMinutes === 0 && (
            <div className="empty-state">No focus data available</div>
          )}
        </div>
      )}

      {/* Category detail modal */}
      {selectedCategory && (
        <div className="category-detail-modal" onClick={() => setSelectedCategory(null)}>
          <div className="category-detail-content" onClick={(e) => e.stopPropagation()}>
            <div className="category-detail-header">
              <h3>{selectedCategory} - Task Details</h3>
              <button className="close-btn" onClick={() => setSelectedCategory(null)}>×</button>
            </div>
            <div className="category-detail-body">
              <div className="total-duration">
                Total Duration: {formatDuration(
                  (viewMode === 'daily' ? dailyCategoryStats : weeklyCategoryStats)
                    .find(item => item.name === selectedCategory)?.duration || 0
                )}
              </div>
              <div className="task-list">
                {getCategoryTasks(selectedCategory).map((task) => (
                  <div key={task.id} className="task-item">
                    <div className="task-title">{task.title}</div>
                    <div className="task-time">
                      {parseLocalDateTime(task.plannedStartTime)?.toLocaleString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      }) || 'N/A'} - {parseLocalDateTime(task.plannedEndTime)?.toLocaleString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      }) || 'N/A'}
                    </div>
                    <div className="task-duration">{formatDuration(task.duration)}</div>
                  </div>
                ))}
                {getCategoryTasks(selectedCategory).length === 0 && (
                  <div className="empty-task">No completed tasks in this category</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delayed/Cancelled detail modal */}
      {selectedDelayCancel && (
        <div className="category-detail-modal" onClick={() => setSelectedDelayCancel(null)}>
          <div className="category-detail-content" onClick={(e) => e.stopPropagation()}>
            <div className="category-detail-header">
              <h3>{selectedDelayCancel.name} - Task Details</h3>
              <button className="close-btn" onClick={() => setSelectedDelayCancel(null)}>×</button>
            </div>
            <div className="category-detail-body">
              <div className="total-duration">
                Total Duration: {formatDuration(selectedDelayCancel.duration || 0)}
              </div>
              <div className="task-list">
                {selectedDelayCancel.tasks.map((task) => (
                  <div key={task.id} className="task-item">
                    <div className="task-title">{task.title}</div>
                    <div className="task-time">
                      {parseLocalDateTime(task.plannedStartTime)?.toLocaleString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      }) || 'N/A'} - {parseLocalDateTime(task.plannedEndTime)?.toLocaleString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      }) || 'N/A'}
                    </div>
                    <div className="task-duration">{formatDuration(task.duration)}</div>
                  </div>
                ))}
                {selectedDelayCancel.tasks.length === 0 && (
                  <div className="empty-task">No tasks in this status</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status comparison detail modal */}
      {selectedStatusComparison && (
        <div className="category-detail-modal" onClick={() => setSelectedStatusComparison(null)}>
          <div className="category-detail-content" onClick={(e) => e.stopPropagation()}>
            <div className="category-detail-header">
              <h3>{selectedStatusComparison.name} - Task Details</h3>
              <button className="close-btn" onClick={() => setSelectedStatusComparison(null)}>×</button>
            </div>
            <div className="category-detail-body">
              <div className="total-duration">
                Total Duration: {formatDuration(selectedStatusComparison.duration || 0)}
              </div>
              <div className="task-list">
                {selectedStatusComparison.tasks.map((task) => (
                  <div key={task.id} className="task-item">
                    <div className="task-title">{task.title}</div>
                    <div className="task-time">
                      {parseLocalDateTime(task.plannedStartTime)?.toLocaleString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      }) || 'N/A'} - {parseLocalDateTime(task.plannedEndTime)?.toLocaleString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      }) || 'N/A'}
                    </div>
                    <div className="task-duration">{formatDuration(task.duration)}</div>
                  </div>
                ))}
                {selectedStatusComparison.tasks.length === 0 && (
                  <div className="empty-task">No tasks in this status</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Analytics;
