import React, { useState, useEffect, useMemo } from 'react';
import { getTasks } from '../api/task';
import TaskDetailModal from './TaskDetailModal';
import './Timeline.css';

function Timeline() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    // Get Monday of this week
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Calculate date range for current week
  const weekDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentWeekStart]);

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

  // Calculate week start and end time (local time format, without timezone)
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

  // Load tasks
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
        console.error('Failed to load tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [weekTimeRange]);

  // Update current time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Format local date as YYYY-MM-DD format (not using UTC)
  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Parse time string to local time (if time string does not contain timezone information, treat it as local time)
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

  // Get tasks for a specific day
  const getTasksForDay = (date) => {
    const dateStr = formatLocalDate(date);
    return tasks.filter(task => {
      // For completed, delayed, cancelled tasks, prefer actual time; otherwise use planned time
      const isPastTask = task.status === 'DONE' || task.status === 'DELAY' || task.status === 'CANCEL';
      
      let timeToCheck;
      if (isPastTask) {
        // Completed tasks: prefer actualStartTime, if not available use actualEndTime, finally fallback to plannedStartTime
        timeToCheck = task.actualStartTime || task.actualEndTime || task.plannedStartTime;
      } else {
        // Incomplete tasks: use planned time
        timeToCheck = task.plannedStartTime;
      }
      
      if (!timeToCheck) return false;
      const taskDateObj = parseLocalDateTime(timeToCheck);
      if (!taskDateObj) return false;
      const taskDate = formatLocalDate(taskDateObj);
      return taskDate === dateStr;
    });
  };

  // Check if two tasks overlap
  const tasksOverlap = (task1, task2) => {
    // Get task display time (past events use actual time, otherwise use planned time)
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

  // Group tasks (overlapping tasks in the same group)
  const groupOverlappingTasks = (dayTasks) => {
    const groups = [];
    const processed = new Set();

    dayTasks.forEach((task, index) => {
      if (processed.has(index)) return;

      const group = [task];
      processed.add(index);

      // Find all tasks that overlap with current task
      dayTasks.forEach((otherTask, otherIndex) => {
        if (index !== otherIndex && !processed.has(otherIndex)) {
          // Check if overlaps with any task in the group
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

  // Calculate task position and height on timeline
  const getTaskPosition = (task) => {
    // For completed, delayed, cancelled tasks, prefer actual time; otherwise use planned time
    const isPastTask = task.status === 'DONE' || task.status === 'DELAY' || task.status === 'CANCEL';
    
    // Determine time to use: if completed task has actualStartTime use it, otherwise use plannedStartTime
    // If completed task has actualEndTime use it, otherwise use plannedEndTime
    let startTime, endTime;
    
    if (isPastTask) {
      // Completed tasks: prefer actual time, if not available use planned time
      startTime = task.actualStartTime || task.plannedStartTime;
      endTime = task.actualEndTime || task.plannedEndTime;
    } else {
      // Incomplete tasks: use planned time
      startTime = task.plannedStartTime;
      endTime = task.plannedEndTime;
    }

    if (!startTime || !endTime) return null;

    const start = parseLocalDateTime(startTime);
    const end = parseLocalDateTime(endTime);
    if (!start || !end) return null;
    
    // Calculate minutes from 0:00 (only consider time part, not date)
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    
    // If end time is before start time (cross-day case), adjust end time
    let duration = endMinutes - startMinutes;
    if (duration < 0) {
      // Cross-day case, assume task continues to same time next day
      duration = (24 * 60) - startMinutes + endMinutes;
    }
    
    duration = Math.max(duration, 15); // Minimum 15 minutes

    // 60 pixels per hour, 1 pixel per minute
    const top = startMinutes;
    const height = duration;

    return { top, height };
  };

  // Handle task click
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  // Get status color
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

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const prevWeek = new Date(currentWeekStart);
    prevWeek.setDate(prevWeek.getDate() - 7);
    setCurrentWeekStart(prevWeek);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const nextWeek = new Date(currentWeekStart);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setCurrentWeekStart(nextWeek);
  };

  // Navigate to week containing today
  const goToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  // Generate timeline (0-24 hours)
  const timeSlots = Array.from({ length: 24 }, (_, i) => i);

  // Format date display
  const formatDate = (date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekday = weekdays[date.getDay()];
    return { month, day, weekday };
  };

  // Format week range display
  const formatWeekRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
  };

  // Check if it's today
  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Format task time
  const formatTaskTime = (dateString) => {
    if (!dateString) return '';
    const date = parseLocalDateTime(dateString);
    if (!date) return '';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Get task display time (past events use actual time, otherwise use planned time)
  const getTaskDisplayTime = (task) => {
    const isPastTask = task.status === 'DONE' || task.status === 'DELAY' || task.status === 'CANCEL';
    
    if (isPastTask) {
      // Completed tasks: prefer actual time, if not available use planned time
      return {
        startTime: task.actualStartTime || task.plannedStartTime,
        endTime: task.actualEndTime || task.plannedEndTime,
      };
    } else {
      // Incomplete tasks: use planned time
      return {
        startTime: task.plannedStartTime,
        endTime: task.plannedEndTime,
      };
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="timeline-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="page-content timeline-container">
      {/* Week navigation bar */}
      <div className="timeline-header">
        <div className="timeline-nav">
          <button onClick={goToPreviousWeek} className="nav-btn">‹</button>
          <button onClick={goToToday} className="nav-btn today-btn">Today</button>
          <button onClick={goToNextWeek} className="nav-btn">›</button>
        </div>
        <div className="timeline-week-range">{formatWeekRange()}</div>
      </div>

      {/* Timeline body */}
      <div className="timeline-body">
        {/* Time axis */}
        <div className="timeline-time-column">
          {/* Time axis header, aligned with date header */}
          <div className="timeline-time-column-header"></div>
          {timeSlots.map((hour) => (
            <div key={hour} className="time-slot">
              <span className="time-label">{hour}:00</span>
            </div>
          ))}
        </div>

        {/* Date columns */}
        <div className="timeline-days-container">
          {weekDates.map((date, dayIndex) => {
            const { month, day, weekday } = formatDate(date);
            const dayTasks = getTasksForDay(date);
            const today = isToday(date);

            return (
              <div key={dayIndex} className="timeline-day-column">
                {/* Date header */}
                <div className={`day-header ${today ? 'today' : ''}`}>
                  <div className="day-weekday">{weekday}</div>
                  <div className={`day-date ${today ? 'today-date' : ''}`}>
                    {month}/{day}
                  </div>
                </div>

                {/* Time slots */}
                <div className="day-time-slots">
                  {timeSlots.map((hour) => (
                    <div key={hour} className="time-slot-cell"></div>
                  ))}
                </div>

                {/* Task blocks */}
                <div className="day-tasks">
                  {(() => {
                    const groups = groupOverlappingTasks(dayTasks);
                    return groups.map((group, groupIndex) => {
                      return group.map((task, taskIndex) => {
                        const position = getTaskPosition(task);
                        if (!position) return null;

                        // Calculate width and position of overlapping tasks
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

      {/* Task detail modal */}
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
