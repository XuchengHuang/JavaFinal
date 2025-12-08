import React, { useState, useEffect, useMemo } from 'react';
import { getTasks } from '../api/task';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import './Analytics.css';

function Analytics() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDelayCancel, setSelectedDelayCancel] = useState(null);
  const [selectedStatusComparison, setSelectedStatusComparison] = useState(null);
  // 获取今天的日期字符串（YYYY-MM-DD格式，使用本地时间）
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
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

  // 获取本周的日期范围（使用本地时间）
  const getWeekRange = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return {
      startTime: formatLocalDateTime(monday),
      endTime: formatLocalDateTime(sunday),
    };
  };

  // 加载任务
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
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
        const allTasks = await getTasks({
          startTime: range.startTime,
          endTime: range.endTime,
        });
        setTasks(allTasks);
      } catch (error) {
        console.error('加载任务失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [viewMode, selectedDate]);

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
  const calculateTaskDuration = (task) => {
    if (!task.plannedStartTime || !task.plannedEndTime) return 0;
    const start = parseLocalDateTime(task.plannedStartTime);
    const end = parseLocalDateTime(task.plannedEndTime);
    if (!start || !end) return 0;
    const duration = Math.max((end - start) / (1000 * 60), 0);
    // 确保返回有效的数字
    return isNaN(duration) ? 0 : duration;
  };

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
  }, [tasks]);

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
  }, [tasks]);

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
  }, [tasks]);

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
  }, [tasks]);

  // 饼状图颜色
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

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
      {/* 视图切换 */}
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
