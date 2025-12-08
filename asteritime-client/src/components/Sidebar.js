import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

/**
 * 左侧导航栏
 */
function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', path: '/dashboard', action: 'DASHBOARD' },
    { text: 'Timeline', path: '/timeline', action: 'TIMELINE' },
    { text: 'Pomodoro', path: '/pomodoro', action: 'POMODORO' },
    { text: 'Analytics', path: '/analytics', action: 'ANALYTICS' },
    { text: 'Journal', path: '/journal', action: 'JOURNAL' },
    { text: 'Settings', path: '/settings', action: 'SETTINGS' },
  ];

  const handleNavigation = (item) => {
    if (item.action === 'SETTINGS') {
      console.log('Switch to: SETTINGS');
      // TODO: 实现设置页面
    } else {
      // 使用 React Router 进行导航
      navigate(item.path);
    }
  };

  return (
    <div className="sidebar">
      {menuItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.action}
            className={`sidebar-button ${isActive ? 'active' : ''}`}
            onClick={() => handleNavigation(item)}
          >
            {item.text}
          </button>
        );
      })}
    </div>
  );
}

export default Sidebar;

