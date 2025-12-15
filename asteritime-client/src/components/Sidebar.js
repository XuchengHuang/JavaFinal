import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

/**
 * Left sidebar navigation
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
  ];

  const handleNavigation = (item) => {
    navigate(item.path);
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

