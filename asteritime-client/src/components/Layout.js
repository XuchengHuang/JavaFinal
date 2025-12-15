import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, getUser } from '../api/auth';
import Sidebar from './Sidebar';
import './Layout.css';

function Layout({ children }) {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const user = getUser();

  // Update current time (update every second)
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(timeInterval);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      // Dispatch custom event to notify App component
      window.dispatchEvent(new Event('logout'));
      // Use replace to avoid adding to history
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout request fails, clear local token and redirect
      window.dispatchEvent(new Event('logout'));
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="layout-container">
      <div className="layout-header">
        <div className="header-left">
          <h1>AsteriTime Dashboard</h1>
          <div className="clock">
            {currentTime.toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </div>
        </div>
        <div className="header-right">
          {user && (
            <span className="welcome-text">
              Welcome, {user.username}
            </span>
          )}
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
      <div className="layout-body">
        <Sidebar />
        <div className="layout-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Layout;

