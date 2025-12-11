import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getTasks } from '../api/task';
import { getJournalEntriesByDate, getJournalEntriesByDateRange } from '../api/journal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { getTodayLocalDateString } from '../utils/dateUtils';
import './Analytics.css';

// 饼状图颜色
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

// 四象限颜色映射
const QUADRANT_COLORS = {
  1: '#FF6B9D', // 重要且紧急 - 粉色
  2: '#A8E6CF', // 重要不紧急 - 浅绿色
  3: '#FFD93D', // 紧急不重要 - 黄色
  4: '#95E1D3', // 不重要不紧急 - 浅蓝色
};

// 四象限名称映射
const QUADRANT_NAMES = {
  1: '重要且紧急',
  2: '重要不紧急',
  3: '紧急不重要',
  4: '不重要不紧急',
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
  const [focusSelectedDate, setFocusSelectedDate] = useState(getTodayLocalDateString()); // 专注标签页的日期选择
  const [overviewSelectedDate, setOverviewSelectedDate] = useState(getTodayLocalDateString()); // 概述标签页的日期选择
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'weekly'

  // 格式化本地时间为 YYYY-MM-DDTHH:mm:ss 格式（不带时区）
  const formatLocalDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  // 获取今天的日期范围（使用本地时间）
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


  // 加载任务和日记数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // 概述标签页：加载指定日期的任务
        if (activeTab === 'overview') {
          // 根据选择的日期加载任务
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
        // 计划标签页：根据viewMode加载指定范围的任务
        else if (activeTab === 'plan') {
          let range;
          if (viewMode === 'daily') {
            // 解析选择的日期字符串（YYYY-MM-DD格式）
            const dateParts = selectedDate.split('-');
            const year = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1; // 月份从0开始
            const day = parseInt(dateParts[2], 10);
            
            const start = new Date(year, month, day, 0, 0, 0);
            const end = new Date(year, month, day, 23, 59, 59);
            
            range = {
              startTime: formatLocalDateTime(start),
              endTime: formatLocalDateTime(end),
            };
          } else {
            const today = new Date();
            const day = today.getDay();
            const diff = today.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(today.setDate(diff));
            monday.setHours(0, 0, 0, 0);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            sunday.setHours(23, 59, 59, 999);
            range = {
              startTime: formatLocalDateTime(monday),
              endTime: formatLocalDateTime(sunday),
            };
          }
          
          // 加载任务
          const allTasks = await getTasks({
            startTime: range.startTime,
            endTime: range.endTime,
          });
          setTasks(allTasks || []);
        }
        // 专注标签页：加载指定日期的日记数据
        else if (activeTab === 'focus') {
          // 加载选择日期的日记数据
          const entries = await getJournalEntriesByDate(focusSelectedDate);
          setJournalEntries(entries || []);
        }
        
        // 加载日记数据（用于专注统计，如果不在专注标签页也需要加载）
        if (activeTab !== 'focus' && viewMode === 'daily') {
          const entries = await getJournalEntriesByDate(selectedDate);
          setJournalEntries(entries || []);
        } else if (activeTab !== 'focus' && viewMode === 'weekly') {
          // 周报：计算开始和结束日期
          const today = new Date();
          const day = today.getDay();
          const diff = today.getDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(today.setDate(diff));
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
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab, viewMode, selectedDate, focusSelectedDate, overviewSelectedDate]);

  // 解析时间字符串为本地时间
  const parseLocalDateTime = (dateString) => {
    if (!dateString) return null;
    // 如果时间字符串不包含时区信息，将其当作本地时间处理
    if (dateString.includes('T')) {
      if (dateString.endsWith('Z') || dateString.includes('+') || dateString.includes('-', 10)) {
        // 有时区信息，使用标准解析
        return new Date(dateString);
      } else {
        // 没有时区信息，当作本地时间处理
        const [datePart, timePart] = dateString.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes, seconds] = (timePart || '00:00:00').split(':').map(Number);
        return new Date(year, month - 1, day, hours, minutes, seconds || 0);
      }
    }
    return new Date(dateString);
  };

  // 计算任务时长（分钟）
  const calculateTaskDuration = useCallback((task) => {
    if (!task.plannedStartTime || !task.plannedEndTime) return 0;
    const start = parseLocalDateTime(task.plannedStartTime);
    const end = parseLocalDateTime(task.plannedEndTime);
    if (!start || !end) return 0;
    const duration = Math.max((end - start) / (1000 * 60), 0);
    // 确保返回有效的数字
    return isNaN(duration) ? 0 : duration;
  }, []);

  // 格式化时长显示
  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${Math.round(minutes)}分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  // 按类别统计时长（日报）- 统计所有有计划时间的任务（包括计划中的和已完成的）
  const dailyCategoryStats = useMemo(() => {
    const categoryMap = new Map();
    
    tasks.forEach(task => {
      // 统计所有有计划时间的任务（TODO、DOING、DONE状态）
      if (!task.plannedStartTime || !task.plannedEndTime) return;
      if (task.status === 'CANCEL' || task.status === 'DELAY') return; // 排除已取消和延期的任务
      
      // 更严格地处理类别：如果 type 为 null/undefined 或者 name 为空，都视为"无类别"
      const categoryName = (task.type && task.type.name) ? task.type.name : '无类别';
      const duration = calculateTaskDuration(task);
      
      // 确保时长是有效数字
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

    // 计算总时长
    const totalDuration = stats.reduce((sum, item) => sum + item.duration, 0);
    
    // 计算百分比
    return stats.map(item => ({
      ...item,
      percentage: totalDuration > 0 ? ((item.duration / totalDuration) * 100).toFixed(1) : 0,
    })).sort((a, b) => b.duration - a.duration);
  }, [tasks, calculateTaskDuration]);

  // 统计延期和取消的任务时长（日报）
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
        name: '延期',
        duration: delayTotal,
        hours: (delayTotal / 60).toFixed(1),
        percentage: totalDuration > 0 ? ((delayTotal / totalDuration) * 100).toFixed(1) : 0,
        status: 'DELAY',
        tasks: delayTasks,
      });
    }
    if (cancelTotal > 0) {
      stats.push({
        name: '已取消',
        duration: cancelTotal,
        hours: (cancelTotal / 60).toFixed(1),
        percentage: totalDuration > 0 ? ((cancelTotal / totalDuration) * 100).toFixed(1) : 0,
        status: 'CANCEL',
        tasks: cancelTasks,
      });
    }

    return stats.sort((a, b) => b.duration - a.duration);
  }, [tasks, calculateTaskDuration]);

  // 对比已完成、延期、取消的任务时长（日报）
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
        name: '已完成',
        duration: doneTotal,
        hours: (doneTotal / 60).toFixed(1),
        percentage: totalDuration > 0 ? ((doneTotal / totalDuration) * 100).toFixed(1) : 0,
        status: 'DONE',
        tasks: doneTasks,
      });
    }
    if (delayTotal > 0) {
      stats.push({
        name: '延期',
        duration: delayTotal,
        hours: (delayTotal / 60).toFixed(1),
        percentage: totalDuration > 0 ? ((delayTotal / totalDuration) * 100).toFixed(1) : 0,
        status: 'DELAY',
        tasks: delayTasks,
      });
    }
    if (cancelTotal > 0) {
      stats.push({
        name: '已取消',
        duration: cancelTotal,
        hours: (cancelTotal / 60).toFixed(1),
        percentage: totalDuration > 0 ? ((cancelTotal / totalDuration) * 100).toFixed(1) : 0,
        status: 'CANCEL',
        tasks: cancelTasks,
      });
    }

    return stats.sort((a, b) => {
      // 按状态排序：已完成 > 延期 > 已取消
      const order = { 'DONE': 1, 'DELAY': 2, 'CANCEL': 3 };
      return order[a.status] - order[b.status];
    });
  }, [tasks, calculateTaskDuration]);

  // 按类别统计时长（周报）- 统计所有有计划时间的任务（包括计划中的和已完成的）
  const weeklyCategoryStats = useMemo(() => {
    const categoryMap = new Map();
    
    tasks.forEach(task => {
      // 统计所有有计划时间的任务（TODO、DOING、DONE状态）
      if (!task.plannedStartTime || !task.plannedEndTime) return;
      if (task.status === 'CANCEL' || task.status === 'DELAY') return; // 排除已取消和延期的任务
      
      // 更严格地处理类别：如果 type 为 null/undefined 或者 name 为空，都视为"无类别"
      const categoryName = (task.type && task.type.name) ? task.type.name : '无类别';
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
      hours: (item.totalDuration / 60).toFixed(1),
    }));

    // 计算总时长
    const totalDuration = stats.reduce((sum, item) => sum + item.totalDuration, 0);
    
    // 计算百分比
    return stats.map(item => ({
      ...item,
      percentage: totalDuration > 0 ? ((item.totalDuration / totalDuration) * 100).toFixed(1) : 0,
    })).sort((a, b) => b.totalDuration - a.totalDuration);
  }, [tasks, calculateTaskDuration]);

  // 按四象限统计已完成任务（概述标签页）
  const completedTasksByQuadrant = useMemo(() => {
    const quadrantMap = new Map();
    
    tasks.forEach(task => {
      // 只统计已完成的任务
      if (task.status !== 'DONE') return;
      
      // 如果选择了日期，只统计该日期的任务
      if (activeTab === 'overview' && overviewSelectedDate) {
        // 检查任务的日期（优先使用plannedStartTime，如果没有则使用createdAt）
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
        
        // 如果任务日期不匹配选择的日期，跳过
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
      name: QUADRANT_NAMES[quadrant] || `象限${quadrant}`,
      count: count,
      color: QUADRANT_COLORS[quadrant] || COLORS[quadrant - 1],
    }));
    
    const total = stats.reduce((sum, item) => sum + item.count, 0);
    
    return stats.map(item => ({
      ...item,
      percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : 0,
    })).sort((a, b) => a.quadrant - b.quadrant);
  }, [tasks, activeTab, overviewSelectedDate]);

  // 按分类统计已完成任务（概述标签页）
  const completedTasksByCategory = useMemo(() => {
    const categoryMap = new Map();
    
    tasks.forEach(task => {
      // 只统计已完成的任务
      if (task.status !== 'DONE') return;
      
      // 如果选择了日期，只统计该日期的任务
      if (activeTab === 'overview' && overviewSelectedDate) {
        // 检查任务的日期（优先使用plannedStartTime，如果没有则使用createdAt）
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
        
        // 如果任务日期不匹配选择的日期，跳过
        if (taskDateStr !== overviewSelectedDate) return;
      }
      
      const categoryName = (task.type && task.type.name) ? task.type.name : '无分类';
      
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

  // 专注统计（专注标签页）
  const focusStats = useMemo(() => {
    // 计算总专注时长和次数
    let totalFocusMinutes = 0;
    let focusCount = 0;
    
    journalEntries.forEach(entry => {
      if (entry.totalFocusMinutes && entry.totalFocusMinutes > 0) {
        totalFocusMinutes += entry.totalFocusMinutes;
        focusCount++;
      }
    });
    
    // 按活动类型统计专注时长（如果有activity字段）
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

  // 专注时段分布（按小时统计选择日期的数据）
  const focusTimeDistribution = useMemo(() => {
    const hourMap = new Map();
    
    // 只统计选择日期的数据
    journalEntries.forEach(entry => {
      if (entry.totalFocusMinutes && entry.totalFocusMinutes > 0) {
        // 获取日记的日期
        let entryDateStr;
        if (entry.date) {
          entryDateStr = entry.date; // 格式：YYYY-MM-DD
        } else if (entry.createdAt) {
          const date = new Date(entry.createdAt);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          entryDateStr = `${year}-${month}-${day}`;
        }
        
        // 只统计选择日期的数据
        if (entryDateStr === focusSelectedDate) {
          // 从createdAt获取小时
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
    
    // 生成24小时的数据
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

  // 饼状图点击事件
  const handlePieClick = (data) => {
    if (data && data.name) {
      setSelectedCategory(data.name);
    }
  };

  // 延期/取消饼状图点击事件
  const handleDelayCancelPieClick = (data) => {
    if (data && data.name) {
      setSelectedDelayCancel(data);
    }
  };

  // 状态对比饼状图点击事件
  const handleStatusComparisonPieClick = (data) => {
    if (data && data.name) {
      setSelectedStatusComparison(data);
    }
  };

  // 获取状态颜色
  const getStatusColor = (status) => {
    const colors = {
      'DONE': '#28a745',    // 绿色
      'DELAY': '#ffc107',    // 黄色
      'CANCEL': '#dc3545',   // 红色
    };
    return colors[status] || '#6c757d';
  };

  // 周报类别点击事件
  const handleWeeklyCategoryClick = (category) => {
    setSelectedCategory(category.name);
  };

  // 获取选中类别的任务列表（返回所有有计划时间的任务，排除已取消和延期的）
  const getCategoryTasks = (categoryName) => {
    return tasks
      .filter(task => {
        // 更严格地处理类别：如果 type 为 null/undefined 或者 name 为空，都视为"无类别"
        const taskCategoryName = (task.type && task.type.name) ? task.type.name : '无类别';
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
        <div className="analytics-loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="page-content analytics-container">
      {/* 标签页切换 */}
      <div className="analytics-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          概述
        </button>
        <button
          className={`tab-btn ${activeTab === 'plan' ? 'active' : ''}`}
          onClick={() => setActiveTab('plan')}
        >
          计划
        </button>
        <button
          className={`tab-btn ${activeTab === 'focus' ? 'active' : ''}`}
          onClick={() => setActiveTab('focus')}
        >
          专注
        </button>
        <button
          className={`tab-btn ${activeTab === 'recurring' ? 'active' : ''}`}
          onClick={() => setActiveTab('recurring')}
        >
          重复事件
        </button>
      </div>

      {/* 视图切换（仅在计划标签页显示） */}
      {activeTab === 'plan' && (
        <div className="analytics-header">
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'daily' ? 'active' : ''}`}
              onClick={() => setViewMode('daily')}
            >
              日报
            </button>
            <button
              className={`toggle-btn ${viewMode === 'weekly' ? 'active' : ''}`}
              onClick={() => setViewMode('weekly')}
            >
              周报
            </button>
          </div>
          {viewMode === 'daily' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-picker"
            />
          )}
        </div>
      )}

      {/* 概述标签页 */}
      {activeTab === 'overview' && (
        <div className="overview-analytics">
          {/* 日期选择器 */}
          <div className="analytics-header">
            <div className="date-selector-group">
              <label htmlFor="overview-date-picker">选择日期：</label>
              <input
                id="overview-date-picker"
                type="date"
                value={overviewSelectedDate}
                onChange={(e) => setOverviewSelectedDate(e.target.value)}
                className="date-picker"
              />
            </div>
          </div>

          {/* 完成计划 - 按四象限饼图 */}
          {completedTasksByQuadrant.length > 0 && (
            <div className="chart-section">
              <h3>完成计划</h3>
              <div className="chart-summary">
                <div className="summary-text">完成计划</div>
                <div className="summary-count">
                  {completedTasksByQuadrant.reduce((sum, item) => sum + item.count, 0)}条
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
                    formatter={(value) => `${value}条`}
                    labelFormatter={(label) => label}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* 只保留一组图例 */}
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

          {/* 完成计划分类 - 横向柱状图 */}
          {completedTasksByCategory.length > 0 && (
            <div className="chart-section">
              <h3>完成计划分类</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={completedTasksByCategory}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip formatter={(value) => `${value}条`} />
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
            <div className="empty-state">暂无已完成的任务数据</div>
          )}
        </div>
      )}

      {/* 计划标签页（原有内容） */}
      {activeTab === 'plan' && (

        <div className="plan-analytics">
          {viewMode === 'daily' ? (
            /* 日报视图 */
            <div className="daily-analytics">
          {dailyCategoryStats.length > 0 ? (
            <>
              <div className="chart-section">
                <h3>类别时长统计 - 柱状图</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyCategoryStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatDuration(value)}
                      labelFormatter={(label) => `类别: ${label}`}
                    />
                    <Bar dataKey="duration" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-section">
                <h3>类别时长占比 - 饼状图</h3>
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
                      labelFormatter={(label) => `类别: ${label}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="empty-state">该日期暂无任务数据</div>
          )}

          {/* 延期/取消统计 */}
          {dailyDelayCancelStats.length > 0 && (
            <>
              <div className="chart-section">
                <h3>延期/取消时长统计 - 柱状图</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyDelayCancelStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatDuration(value)}
                      labelFormatter={(label) => `状态: ${label}`}
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
                <h3>延期/取消时长占比 - 饼状图</h3>
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
                      labelFormatter={(label) => `状态: ${label}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {/* 状态对比饼状图 */}
          {dailyStatusComparisonStats.length > 0 && (
            <div className="chart-section">
              <h3>任务状态时长对比 - 饼状图</h3>
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
                    labelFormatter={(label) => `状态: ${label}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ) : (
        /* 周报视图 */
        <div className="weekly-analytics">
          <h3>本周类别统计</h3>
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
              <div className="empty-state">本周暂无任务数据</div>
            )}
          </div>
        </div>
          )}
        </div>
      )}

      {/* 专注标签页 */}
      {activeTab === 'focus' && (
        <div className="focus-analytics">
          {/* 日期选择器 */}
          <div className="analytics-header">
            <div className="date-selector-group">
              <label htmlFor="focus-date-picker">选择日期：</label>
              <input
                id="focus-date-picker"
                type="date"
                value={focusSelectedDate}
                onChange={(e) => setFocusSelectedDate(e.target.value)}
                className="date-picker"
              />
            </div>
          </div>

          {/* 专注摘要卡片 */}
          <div className="focus-summary-card">
            <div className="summary-item">
              <div className="summary-label">专注时长</div>
              <div className="summary-value">{formatDuration(focusStats.totalFocusMinutes)}</div>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-item">
              <div className="summary-label">专注次数</div>
              <div className="summary-value">{focusStats.focusCount}次</div>
            </div>
          </div>

          {/* 专注时长分布 - 环形图 */}
          {focusStats.activityStats.length > 0 && (
            <div className="chart-section">
              <h3>专注时长分布</h3>
              <div className="chart-summary">
                <div className="summary-text">总专注时长</div>
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
              
              {/* 详细列表 */}
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

          {/* 专注时段分布（按小时显示选择日期的数据） */}
          {focusTimeDistribution.some(item => item.minutes > 0) && (
            <div className="chart-section">
              <h3>专注时段分布（{focusSelectedDate}）</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={focusTimeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="hour" 
                    label={{ value: '小时', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    label={{ value: '分钟', angle: -90, position: 'insideLeft' }}
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
            <div className="empty-state">暂无专注数据</div>
          )}
        </div>
      )}

      {/* 重复事件标签页 */}
      {activeTab === 'recurring' && (
        <div className="recurring-analytics">
          <div className="empty-state">重复事件统计功能开发中...</div>
        </div>
      )}

      {/* 类别详情弹窗 */}
      {selectedCategory && (
        <div className="category-detail-modal" onClick={() => setSelectedCategory(null)}>
          <div className="category-detail-content" onClick={(e) => e.stopPropagation()}>
            <div className="category-detail-header">
              <h3>{selectedCategory} - 任务详情</h3>
              <button className="close-btn" onClick={() => setSelectedCategory(null)}>×</button>
            </div>
            <div className="category-detail-body">
              <div className="total-duration">
                总时长: {formatDuration(
                  (viewMode === 'daily' ? dailyCategoryStats : weeklyCategoryStats)
                    .find(item => item.name === selectedCategory)?.duration || 0
                )}
              </div>
              <div className="task-list">
                {getCategoryTasks(selectedCategory).map((task) => (
                  <div key={task.id} className="task-item">
                    <div className="task-title">{task.title}</div>
                    <div className="task-time">
                      {parseLocalDateTime(task.plannedStartTime)?.toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      }) || 'N/A'} - {parseLocalDateTime(task.plannedEndTime)?.toLocaleString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      }) || 'N/A'}
                    </div>
                    <div className="task-duration">{formatDuration(task.duration)}</div>
                  </div>
                ))}
                {getCategoryTasks(selectedCategory).length === 0 && (
                  <div className="empty-task">该类别下暂无已完成任务</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 延期/取消详情弹窗 */}
      {selectedDelayCancel && (
        <div className="category-detail-modal" onClick={() => setSelectedDelayCancel(null)}>
          <div className="category-detail-content" onClick={(e) => e.stopPropagation()}>
            <div className="category-detail-header">
              <h3>{selectedDelayCancel.name} - 任务详情</h3>
              <button className="close-btn" onClick={() => setSelectedDelayCancel(null)}>×</button>
            </div>
            <div className="category-detail-body">
              <div className="total-duration">
                总时长: {formatDuration(selectedDelayCancel.duration || 0)}
              </div>
              <div className="task-list">
                {selectedDelayCancel.tasks.map((task) => (
                  <div key={task.id} className="task-item">
                    <div className="task-title">{task.title}</div>
                    <div className="task-time">
                      {parseLocalDateTime(task.plannedStartTime)?.toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      }) || 'N/A'} - {parseLocalDateTime(task.plannedEndTime)?.toLocaleString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      }) || 'N/A'}
                    </div>
                    <div className="task-duration">{formatDuration(task.duration)}</div>
                  </div>
                ))}
                {selectedDelayCancel.tasks.length === 0 && (
                  <div className="empty-task">该状态下暂无任务</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 状态对比详情弹窗 */}
      {selectedStatusComparison && (
        <div className="category-detail-modal" onClick={() => setSelectedStatusComparison(null)}>
          <div className="category-detail-content" onClick={(e) => e.stopPropagation()}>
            <div className="category-detail-header">
              <h3>{selectedStatusComparison.name} - 任务详情</h3>
              <button className="close-btn" onClick={() => setSelectedStatusComparison(null)}>×</button>
            </div>
            <div className="category-detail-body">
              <div className="total-duration">
                总时长: {formatDuration(selectedStatusComparison.duration || 0)}
              </div>
              <div className="task-list">
                {selectedStatusComparison.tasks.map((task) => (
                  <div key={task.id} className="task-item">
                    <div className="task-title">{task.title}</div>
                    <div className="task-time">
                      {parseLocalDateTime(task.plannedStartTime)?.toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      }) || 'N/A'} - {parseLocalDateTime(task.plannedEndTime)?.toLocaleString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      }) || 'N/A'}
                    </div>
                    <div className="task-duration">{formatDuration(task.duration)}</div>
                  </div>
                ))}
                {selectedStatusComparison.tasks.length === 0 && (
                  <div className="empty-task">该状态下暂无任务</div>
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
