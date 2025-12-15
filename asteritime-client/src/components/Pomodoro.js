import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getFocusTime, addFocusMinutes } from '../api/journal';
import './Pomodoro.css';

function Pomodoro() {
  const [inputMinutes, setInputMinutes] = useState(25); // User input minutes
  const [totalSeconds, setTotalSeconds] = useState(25 * 60); // Total seconds (25 minutes = 1500 seconds)
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [initialMinutes, setInitialMinutes] = useState(25); // Record minutes at start
  const intervalRef = useRef(null);
  const savedRef = useRef(false); // Prevent duplicate saves
  const wasManuallyResetRef = useRef(false); // Mark if manually reset

  // Get today's date string (YYYY-MM-DD format)
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Load today's accumulated focus time
  const loadTodayFocusTime = useCallback(async () => {
    try {
      const today = getTodayDateString();
      const focusTime = await getFocusTime(today);
      setTotalFocusMinutes(focusTime || 0);
    } catch (error) {
      console.error('Failed to load today\'s focus time:', error);
    }
  }, []);

  // Load accumulated time when component mounts
  useEffect(() => {
    loadTodayFocusTime();
  }, [loadTodayFocusTime]);

  // Countdown logic - use total seconds to manage, avoid state update issues
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTotalSeconds((prevTotalSeconds) => {
          if (prevTotalSeconds > 0) {
            return prevTotalSeconds - 1;
          } else {
            // Countdown naturally ends (not manually reset)
            // Only mark as completed if not manually reset
            if (!wasManuallyResetRef.current) {
              setIsRunning(false);
              setIsPaused(false);
              setIsCompleted(true); // Only set to true when naturally completed
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

  // When countdown naturally completes, save focus time (only natural completion saves, manual reset does not save)
  useEffect(() => {
    // Ensure it's natural completion (not manually reset), has initial minutes, and hasn't been saved
    if (isCompleted && initialMinutes > 0 && !savedRef.current && !wasManuallyResetRef.current) {
      savedRef.current = true;
      const saveFocusTime = async () => {
        try {
          const today = getTodayDateString();
          console.log('Countdown naturally completed, saving focus time:', { date: today, minutes: initialMinutes });
          const result = await addFocusMinutes(today, initialMinutes);
          console.log('Save successful:', result);
          // Reload accumulated time
          await loadTodayFocusTime();
          
          // Play notification sound (optional)
          alert(`Pomodoro completed! Focused for ${initialMinutes} minutes`);
        } catch (error) {
          console.error('Failed to save focus time:', error);
          console.error('Error details:', error.message, error.stack);
          alert(`Failed to save focus time: ${error.message || 'Please try again later'}`);
          savedRef.current = false; // Save failed, allow retry
        }
      };
      saveFocusTime();
    }
  }, [isCompleted, initialMinutes, loadTodayFocusTime]);

  // Start countdown
  const handleStart = () => {
    const mins = inputMinutes;
    if (mins < 1 || mins > 120) {
      alert('Please enter minutes between 1-120');
      return;
    }
    const totalSecs = mins * 60; // Convert to seconds
    setTotalSeconds(totalSecs);
    setInitialMinutes(mins); // Record minutes at start
    setIsRunning(true);
    setIsPaused(false);
    setIsCompleted(false);
    savedRef.current = false; // Reset save flag
    wasManuallyResetRef.current = false; // Reset manual reset flag
  };

  // Pause/Resume
  const handlePause = () => {
    if (isRunning) {
      setIsPaused(!isPaused);
    }
  };

  // Reset (manual reset, does not save time)
  const handleReset = () => {
    wasManuallyResetRef.current = true; // Mark as manual reset
    setIsRunning(false);
    setIsPaused(false);
    setIsCompleted(false); // Ensure it won't trigger save
    const totalSecs = inputMinutes * 60; // Convert to seconds
    setTotalSeconds(totalSecs);
    setInitialMinutes(0); // Set to 0, ensure even if isCompleted is true it won't save
    savedRef.current = false; // Reset save flag
    
    // Delay reset manual reset flag, ensure countdown end check has completed
    setTimeout(() => {
      wasManuallyResetRef.current = false;
    }, 100);
  };

  // Format time display (MM:SS)
  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Format accumulated time display
  const formatTotalTime = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  return (
    <div className="pomodoro-container">
      <div className="pomodoro-content">
        {/* Clock icon */}
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

        {/* Countdown settings */}
        <div className="timer-settings">
          <label htmlFor="timer-minutes">Set Time (minutes):</label>
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
                const totalSecs = value * 60; // Convert to seconds
                setTotalSeconds(totalSecs);
              }
            }}
            disabled={isRunning}
            className="timer-input"
          />
        </div>

        {/* Countdown display */}
        <div className="timer-display">
          <div className={`timer-time ${isCompleted ? 'completed' : ''}`}>
            {formatTime(totalSeconds)}
          </div>
        </div>

        {/* Control buttons */}
        <div className="timer-controls">
          {!isRunning ? (
            <button className="timer-btn start-btn" onClick={handleStart}>
              Start
            </button>
          ) : (
            <>
              <button className="timer-btn pause-btn" onClick={handlePause}>
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button className="timer-btn reset-btn" onClick={handleReset}>
                Reset
              </button>
            </>
          )}
        </div>

        {/* Accumulated focus time display */}
        <div className="total-focus-time">
          <div className="total-focus-label">Today's Total Focus Time</div>
          <div className="total-focus-value">{formatTotalTime(totalFocusMinutes)}</div>
        </div>
      </div>
    </div>
  );
}

export default Pomodoro;
