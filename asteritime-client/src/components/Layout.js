import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, getUser } from '../api/auth';
import Sidebar from './Sidebar';
import './Layout.css';

function Layout({ children }) {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const user = getUser();

  // 更新当前时间（每秒更新一次）
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // 每秒更新

    return () => clearInterval(timeInterval);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('登出失败:', error);
      // 即使登出请求失败，也清除本地 token 并跳转
      navigate('/login');
    }
  };

  return (
    <div className="layout-container">
      <div className="layout-header">
        <div className="header-left">
          <h1>AsteriTime Dashboard</h1>
          <div className="clock">
            {currentTime.toLocaleTimeString('zh-CN', {
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
            登出
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

