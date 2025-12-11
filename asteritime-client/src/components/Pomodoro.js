import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getFocusTime, addFocusMinutes } from '../api/journal';
import './Pomodoro.css';

function Pomodoro() {
  const [inputMinutes, setInputMinutes] = useState(25); // 用户输入的分钟数
  const [totalSeconds, setTotalSeconds] = useState(25 * 60); // 总秒数（25分钟 = 1500秒）
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [initialMinutes, setInitialMinutes] = useState(25); // 记录开始时的分钟数
  const intervalRef = useRef(null);
  const savedRef = useRef(false); // 防止重复保存
  const wasManuallyResetRef = useRef(false); // 标记是否是手动重置

  // 获取今天的日期字符串（YYYY-MM-DD格式）
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 加载今天的累计专注时间
  const loadTodayFocusTime = useCallback(async () => {
    try {
      const today = getTodayDateString();
      const focusTime = await getFocusTime(today);
      setTotalFocusMinutes(focusTime || 0);
    } catch (error) {
      console.error('加载今日专注时间失败:', error);
    }
  }, []);

  // 组件挂载时加载累计时间
  useEffect(() => {
    loadTodayFocusTime();
  }, [loadTodayFocusTime]);

  // 倒计时逻辑 - 使用总秒数来管理，避免状态更新问题
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTotalSeconds((prevTotalSeconds) => {
          if (prevTotalSeconds > 0) {
            return prevTotalSeconds - 1;
          } else {
            // 倒计时自然结束（不是手动重置）
            // 只有在不是手动重置的情况下才标记为完成
            if (!wasManuallyResetRef.current) {
              setIsRunning(false);
              setIsPaused(false);
              setIsCompleted(true); // 只有自然完成时才设置为 true
            }
            return 0;
          }
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused]);

  // 当倒计时自然完成时，保存专注时间（只有自然完成才保存，手动重置不保存）
  useEffect(() => {
    // 确保是自然完成（不是手动重置），且有初始分钟数，且未保存过
    if (isCompleted && initialMinutes > 0 && !savedRef.current && !wasManuallyResetRef.current) {
      savedRef.current = true;
      const saveFocusTime = async () => {
        try {
          const today = getTodayDateString();
          console.log('倒计时自然完成，保存专注时间:', { date: today, minutes: initialMinutes });
          const result = await addFocusMinutes(today, initialMinutes);
          console.log('保存成功:', result);
          // 重新加载累计时间
          await loadTodayFocusTime();
          
          // 播放提示音（可选）
          alert(`番茄钟完成！本次专注 ${initialMinutes} 分钟`);
        } catch (error) {
          console.error('保存专注时间失败:', error);
          console.error('错误详情:', error.message, error.stack);
          alert(`保存专注时间失败: ${error.message || '请稍后重试'}`);
          savedRef.current = false; // 保存失败，允许重试
        }
      };
      saveFocusTime();
    }
  }, [isCompleted, initialMinutes, loadTodayFocusTime]);

  // 开始倒计时
  const handleStart = () => {
    const mins = inputMinutes;
    if (mins < 1 || mins > 120) {
      alert('请输入1-120之间的分钟数');
      return;
    }
    const totalSecs = mins * 60; // 转换为秒数
    setTotalSeconds(totalSecs);
    setInitialMinutes(mins); // 记录开始时的分钟数
    setIsRunning(true);
    setIsPaused(false);
    setIsCompleted(false);
    savedRef.current = false; // 重置保存标志
    wasManuallyResetRef.current = false; // 重置手动重置标志
  };

  // 暂停/继续
  const handlePause = () => {
    if (isRunning) {
      setIsPaused(!isPaused);
    }
  };

  // 重置（手动重置，不保存时间）
  const handleReset = () => {
    wasManuallyResetRef.current = true; // 标记为手动重置
    setIsRunning(false);
    setIsPaused(false);
    setIsCompleted(false); // 确保不会触发保存
    const totalSecs = inputMinutes * 60; // 转换为秒数
    setTotalSeconds(totalSecs);
    setInitialMinutes(0); // 设置为0，确保即使isCompleted为true也不会保存
    savedRef.current = false; // 重置保存标志
    
    // 延迟重置手动重置标志，确保倒计时结束的检查已经完成
    setTimeout(() => {
      wasManuallyResetRef.current = false;
    }, 100);
  };

  // 格式化时间显示（MM:SS）
  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 格式化累计时间显示
  const formatTotalTime = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}小时${mins}分钟`;
    }
    return `${mins}分钟`;
  };

  return (
    <div className="pomodoro-container">
      <div className="pomodoro-content">
        {/* 闹钟图标 */}
        <div className="pomodoro-icon">
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* 倒计时设置 */}
        <div className="timer-settings">
          <label htmlFor="timer-minutes">设置时间（分钟）：</label>
          <input
            id="timer-minutes"
            type="number"
            min="1"
            max="120"
            value={inputMinutes}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 25;
              setInputMinutes(value);
              if (!isRunning) {
                const totalSecs = value * 60; // 转换为秒数
                setTotalSeconds(totalSecs);
              }
            }}
            disabled={isRunning}
            className="timer-input"
          />
        </div>

        {/* 倒计时显示 */}
        <div className="timer-display">
          <div className={`timer-time ${isCompleted ? 'completed' : ''}`}>
            {formatTime(totalSeconds)}
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="timer-controls">
          {!isRunning ? (
            <button className="timer-btn start-btn" onClick={handleStart}>
              开始
            </button>
          ) : (
            <>
              <button className="timer-btn pause-btn" onClick={handlePause}>
                {isPaused ? '继续' : '暂停'}
              </button>
              <button className="timer-btn reset-btn" onClick={handleReset}>
                重置
              </button>
            </>
          )}
        </div>

        {/* 累计专注时间显示 */}
        <div className="total-focus-time">
          <div className="total-focus-label">今日累计专注时间</div>
          <div className="total-focus-value">{formatTotalTime(totalFocusMinutes)}</div>
        </div>
      </div>
    </div>
  );
}

export default Pomodoro;
