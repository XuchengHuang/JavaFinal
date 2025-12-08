import React, { useState, useEffect, useMemo } from 'react';
import { getTasks } from '../api/task';
import TaskDetailModal from './TaskDetailModal';
import './Timeline.css';

function Timeline() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    // 获取本周一的日期
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // 调整到周一
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 计算当前周的日期范围
  const weekDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentWeekStart]);

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

  // 计算周的开始和结束时间（本地时间格式，不带时区）
  const weekTimeRange = useMemo(() => {
    const start = new Date(currentWeekStart);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 7);
    end.setHours(0, 0, 0, 0);
    
    return {
      startTime: formatLocalDateTime(start),
      endTime: formatLocalDateTime(end),
    };
  }, [currentWeekStart]);

  // 加载任务
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        const weekTasks = await getTasks({
          startTime: weekTimeRange.startTime,
          endTime: weekTimeRange.endTime,
        });
        setTasks(weekTasks);
      } catch (error) {
        console.error('加载任务失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [weekTimeRange]);

  // 更新当前时间
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 每分钟更新一次

    return () => clearInterval(interval);
  }, []);

  // 格式化本地日期为 YYYY-MM-DD 格式（不使用 UTC）
  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 解析时间字符串为本地时间（如果时间字符串不包含时区信息，将其当作本地时间处理）
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

  // 获取某一天的任务
  const getTasksForDay = (date) => {
    const dateStr = formatLocalDate(date);
    return tasks.filter(task => {
      // 对于已完成、延期、已取消的任务，优先使用实际时间；否则使用计划时间
      const isPastTask = task.status === 'DONE' || task.status === 'DELAY' || task.status === 'CANCEL';
      
      let timeToCheck;
      if (isPastTask) {
        // 已完成的任务：优先使用actualStartTime，如果没有则使用actualEndTime，最后fallback到plannedStartTime
        timeToCheck = task.actualStartTime || task.actualEndTime || task.plannedStartTime;
      } else {
        // 未完成的任务：使用计划时间
        timeToCheck = task.plannedStartTime;
      }
      
      if (!timeToCheck) return false;
      const taskDateObj = parseLocalDateTime(timeToCheck);
      if (!taskDateObj) return false;
      const taskDate = formatLocalDate(taskDateObj);
      return taskDate === dateStr;
    });
  };

  // 检查两个任务是否重叠
  const tasksOverlap = (task1, task2) => {
    // 获取任务的显示时间（已过去的事件使用实际时间，否则使用计划时间）
    const getTaskTime = (task) => {
      const isPastTask = task.status === 'DONE' || task.status === 'DELAY' || task.status === 'CANCEL';
      return {
        startTime: isPastTask && task.actualStartTime ? task.actualStartTime : task.plannedStartTime,
        endTime: isPastTask && task.actualEndTime ? task.actualEndTime : task.plannedEndTime,
      };
    };

    const time1 = getTaskTime(task1);
    const time2 = getTaskTime(task2);

    if (!time1.startTime || !time1.endTime || !time2.startTime || !time2.endTime) {
      return false;
    }

    const start1 = parseLocalDateTime(time1.startTime);
    const end1 = parseLocalDateTime(time1.endTime);
    const start2 = parseLocalDateTime(time2.startTime);
    const end2 = parseLocalDateTime(time2.endTime);
    
    if (!start1 || !end1 || !start2 || !end2) {
      return false;
    }

    return !(end1.getTime() <= start2.getTime() || end2.getTime() <= start1.getTime());
  };

  // 将任务分组（重叠的任务在同一组）
  const groupOverlappingTasks = (dayTasks) => {
    const groups = [];
    const processed = new Set();

    dayTasks.forEach((task, index) => {
      if (processed.has(index)) return;

      const group = [task];
      processed.add(index);

      // 查找所有与当前任务重叠的任务
      dayTasks.forEach((otherTask, otherIndex) => {
        if (index !== otherIndex && !processed.has(otherIndex)) {
          // 检查是否与组内任何任务重叠
          const overlapsWithGroup = group.some(t => tasksOverlap(t, otherTask));
          if (overlapsWithGroup) {
            group.push(otherTask);
            processed.add(otherIndex);
          }
        }
      });

      groups.push(group);
    });

    return groups;
  };

  // 计算任务在时间轴上的位置和高度
  const getTaskPosition = (task) => {
    // 对于已完成、延期、已取消的任务，优先使用实际时间；否则使用计划时间
    const isPastTask = task.status === 'DONE' || task.status === 'DELAY' || task.status === 'CANCEL';
    
    // 确定使用的时间：如果已完成任务有actualStartTime就用actualStartTime，否则用plannedStartTime
    // 如果已完成任务有actualEndTime就用actualEndTime，否则用plannedEndTime
    let startTime, endTime;
    
    if (isPastTask) {
      // 已完成的任务：优先使用实际时间，如果没有则使用计划时间
      startTime = task.actualStartTime || task.plannedStartTime;
      endTime = task.actualEndTime || task.plannedEndTime;
    } else {
      // 未完成的任务：使用计划时间
      startTime = task.plannedStartTime;
      endTime = task.plannedEndTime;
    }

    if (!startTime || !endTime) return null;

    const start = parseLocalDateTime(startTime);
    const end = parseLocalDateTime(endTime);
    if (!start || !end) return null;
    
    // 计算从0点开始的分钟数（只考虑时间部分，不考虑日期）
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    
    // 如果结束时间在开始时间之前（跨天情况），调整结束时间
    let duration = endMinutes - startMinutes;
    if (duration < 0) {
      // 跨天情况，假设任务持续到第二天同一时间
      duration = (24 * 60) - startMinutes + endMinutes;
    }
    
    duration = Math.max(duration, 15); // 最小15分钟

    // 每个小时60像素，每分钟1像素
    const top = startMinutes;
    const height = duration;

    return { top, height };
  };

  // 处理任务点击
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  // 获取状态颜色
  const getStatusColor = (status) => {
    const colors = {
      TODO: '#6c757d',
      DOING: '#007bff',
      DONE: '#28a745',
      DELAY: '#ffc107',
      CANCEL: '#dc3545',
    };
    return colors[status] || '#6c757d';
  };

  // 导航到上一周
  const goToPreviousWeek = () => {
    const prevWeek = new Date(currentWeekStart);
    prevWeek.setDate(prevWeek.getDate() - 7);
    setCurrentWeekStart(prevWeek);
  };

  // 导航到下一周
  const goToNextWeek = () => {
    const nextWeek = new Date(currentWeekStart);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setCurrentWeekStart(nextWeek);
  };

  // 导航到今天所在周
  const goToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  // 生成时间轴（0-24小时）
  const timeSlots = Array.from({ length: 24 }, (_, i) => i);

  // 格式化日期显示
  const formatDate = (date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[date.getDay()];
    return { month, day, weekday };
  };

  // 格式化周范围显示
  const formatWeekRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`;
  };

  // 检查是否是今天
  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // 格式化任务时间
  const formatTaskTime = (dateString) => {
    if (!dateString) return '';
    const date = parseLocalDateTime(dateString);
    if (!date) return '';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 获取任务的显示时间（已过去的事件使用实际时间，否则使用计划时间）
  const getTaskDisplayTime = (task) => {
    const isPastTask = task.status === 'DONE' || task.status === 'DELAY' || task.status === 'CANCEL';
    
    if (isPastTask) {
      // 已完成的任务：优先使用实际时间，如果没有则使用计划时间
      return {
        startTime: task.actualStartTime || task.plannedStartTime,
        endTime: task.actualEndTime || task.plannedEndTime,
      };
    } else {
      // 未完成的任务：使用计划时间
      return {
        startTime: task.plannedStartTime,
        endTime: task.plannedEndTime,
      };
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="timeline-loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="page-content timeline-container">
      {/* 周导航栏 */}
      <div className="timeline-header">
        <div className="timeline-nav">
          <button onClick={goToPreviousWeek} className="nav-btn">‹</button>
          <button onClick={goToToday} className="nav-btn today-btn">今天</button>
          <button onClick={goToNextWeek} className="nav-btn">›</button>
        </div>
        <div className="timeline-week-range">{formatWeekRange()}</div>
      </div>

      {/* 时间线主体 */}
      <div className="timeline-body">
        {/* 时间轴 */}
        <div className="timeline-time-column">
          {/* 时间轴头部，与日期头部对齐 */}
          <div className="timeline-time-column-header"></div>
          {timeSlots.map((hour) => (
            <div key={hour} className="time-slot">
              <span className="time-label">{hour}:00</span>
            </div>
          ))}
        </div>

        {/* 日期列 */}
        <div className="timeline-days-container">
          {weekDates.map((date, dayIndex) => {
            const { month, day, weekday } = formatDate(date);
            const dayTasks = getTasksForDay(date);
            const today = isToday(date);

            return (
              <div key={dayIndex} className="timeline-day-column">
                {/* 日期头部 */}
                <div className={`day-header ${today ? 'today' : ''}`}>
                  <div className="day-weekday">{weekday}</div>
                  <div className={`day-date ${today ? 'today-date' : ''}`}>
                    {month}/{day}
                  </div>
                </div>

                {/* 时间格 */}
                <div className="day-time-slots">
                  {timeSlots.map((hour) => (
                    <div key={hour} className="time-slot-cell"></div>
                  ))}
                </div>

                {/* 任务块 */}
                <div className="day-tasks">
                  {(() => {
                    const groups = groupOverlappingTasks(dayTasks);
                    return groups.map((group, groupIndex) => {
                      return group.map((task, taskIndex) => {
                        const position = getTaskPosition(task);
                        if (!position) return null;

                        // 计算重叠任务的宽度和位置
                        const groupSize = group.length;
                        const width = groupSize > 1 ? `${100 / groupSize}%` : '100%';
                        const left = groupSize > 1 ? `${(taskIndex * 100) / groupSize}%` : '0';

                      const displayTime = getTaskDisplayTime(task);
                      return (
                        <div
                          key={task.id}
                          className="task-block"
                          style={{
                            top: `${position.top}px`,
                            height: `${Math.max(position.height, 20)}px`,
                            width: width,
                            left: left,
                            backgroundColor: getStatusColor(task.status),
                          }}
                          onClick={() => handleTaskClick(task)}
                          title={`${task.title}\n${formatTaskTime(displayTime.startTime)} - ${formatTaskTime(displayTime.endTime)}`}
                        >
                          <div className="task-title">{task.title}</div>
                        </div>
                      );
                      });
                    });
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 任务详情弹窗 */}
      <TaskDetailModal
        isOpen={isDetailModalOpen}
        task={selectedTask}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTask(null);
        }}
      />
    </div>
  );
}

export default Timeline;
